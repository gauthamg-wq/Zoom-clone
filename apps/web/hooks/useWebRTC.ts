"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WSEvent, WSMessage } from "@/lib/types";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface UseWebRTCOptions {
  localStream: MediaStream | null;
  onRemoteStream: (clientId: string, stream: MediaStream) => void;
  onRemoteStreamRemoved: (clientId: string) => void;
  send: (message: WSMessage) => void;
}

interface UseWebRTCReturn {
  handleSignal: (event: WSEvent) => void;
  handleExistingParticipants: (clientIds: string[]) => void;
  handleParticipantLeft: (clientId: string) => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  isScreenSharing: boolean;
  localPreviewStream: MediaStream | null;
}

export function useWebRTC({
  localStream,
  onRemoteStream,
  onRemoteStreamRemoved,
  send,
}: UseWebRTCOptions): UseWebRTCReturn {
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  // Candidates that arrive before setRemoteDescription is called are queued here
  const iceCandidateQueue = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map(),
  );
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localPreviewStream, setLocalPreviewStream] =
    useState<MediaStream | null>(null);

  // Keep stable refs so callbacks don't go stale
  const sendRef = useRef(send);
  const localStreamRef = useRef(localStream);

  useEffect(() => {
    sendRef.current = send;
    localStreamRef.current = localStream;
  }, [send, localStream]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const handleParticipantLeft = useCallback(
    (clientId: string) => {
      const pc = peerConnections.current.get(clientId);
      pc?.close();
      peerConnections.current.delete(clientId);
      iceCandidateQueue.current.delete(clientId);
      onRemoteStreamRemoved(clientId);
    },
    [onRemoteStreamRemoved],
  );

  async function flushCandidateQueue(remoteClientId: string) {
    const pc = peerConnections.current.get(remoteClientId);
    const queued = iceCandidateQueue.current.get(remoteClientId) ?? [];
    for (const candidate of queued) {
      try {
        await pc?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore stale candidates
      }
    }
    iceCandidateQueue.current.delete(remoteClientId);
  }

  async function applyOrQueueCandidate(
    remoteClientId: string,
    candidate: RTCIceCandidateInit,
  ) {
    const pc = peerConnections.current.get(remoteClientId);
    if (!pc || pc.remoteDescription === null) {
      const queue = iceCandidateQueue.current.get(remoteClientId) ?? [];
      queue.push(candidate);
      iceCandidateQueue.current.set(remoteClientId, queue);
    } else {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore stale candidates
      }
    }
  }

  function createPeerConnection(remoteClientId: string): RTCPeerConnection {
    // Close any existing PC for this peer before creating a new one
    const existing = peerConnections.current.get(remoteClientId);
    if (existing) {
      existing.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local camera/mic tracks
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    // If screen sharing is active, also replace the video track in the new PC
    if (screenTrackRef.current) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      sender?.replaceTrack(screenTrackRef.current);
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        sendRef.current({
          event: "ice-candidate",
          targetClientId: remoteClientId,
          candidate: candidate.toJSON(),
        });
      }
    };

    pc.ontrack = ({ streams }) => {
      if (streams[0]) {
        onRemoteStream(remoteClientId, streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        console.warn(
          `[WebRTC] PC ${remoteClientId} state: ${pc.connectionState}`,
        );
        handleParticipantLeft(remoteClientId);
      }
    };

    peerConnections.current.set(remoteClientId, pc);
    return pc;
  }

  async function initiateOffer(remoteClientId: string) {
    const pc = createPeerConnection(remoteClientId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendRef.current({
      event: "offer",
      targetClientId: remoteClientId,
      sdp: offer,
    });
  }

  // ── Public handlers ───────────────────────────────────────────────────────

  const handleExistingParticipants = useCallback(
    async (clientIds: string[]) => {
      for (const id of clientIds) {
        await initiateOffer(id);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleSignal = useCallback(async (event: WSEvent) => {
    switch (event.event) {
      case "offer": {
        const pc = createPeerConnection(event.clientId);
        await pc.setRemoteDescription(new RTCSessionDescription(event.sdp));
        await flushCandidateQueue(event.clientId);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendRef.current({
          event: "answer",
          targetClientId: event.clientId,
          sdp: answer,
        });
        break;
      }
      case "answer": {
        const pc = peerConnections.current.get(event.clientId);
        if (!pc) break;
        await pc.setRemoteDescription(new RTCSessionDescription(event.sdp));
        await flushCandidateQueue(event.clientId);
        break;
      }
      case "ice-candidate": {
        await applyOrQueueCandidate(event.clientId, event.candidate);
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Screen sharing ────────────────────────────────────────────────────────

  const stopScreenShare = useCallback(() => {
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0] ?? null;
    for (const pc of peerConnections.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (cameraTrack) sender?.replaceTrack(cameraTrack);
    }
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    setLocalPreviewStream(null);
    setIsScreenSharing(false);
    sendRef.current({ event: "screen-share-stopped" });
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

      for (const pc of peerConnections.current.values()) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        await sender?.replaceTrack(screenTrack);
      }

      // Show screen in the local preview tile
      setLocalPreviewStream(screenStream);
      setIsScreenSharing(true);

      // Handle the browser's native "Stop sharing" button
      screenTrack.onended = stopScreenShare;
      sendRef.current({ event: "screen-share-started" });
    } catch {
      // User cancelled or permission denied — silently ignore
    }
  }, [stopScreenShare]);

  return {
    handleSignal,
    handleExistingParticipants,
    handleParticipantLeft,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    localPreviewStream,
  };
}
