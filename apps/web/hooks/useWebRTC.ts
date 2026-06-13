"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WSEvent, WSMessage } from "@/lib/types";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: process.env.NEXT_PUBLIC_TURN_URL ?? "turn:openrelay.metered.ca:80",
      username: process.env.NEXT_PUBLIC_TURN_USERNAME ?? "openrelayproject",
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL ?? "openrelayproject",
    },
    {
      urls:
        process.env.NEXT_PUBLIC_TURN_URL_TCP ??
        "turn:openrelay.metered.ca:443?transport=tcp",
      username: process.env.NEXT_PUBLIC_TURN_USERNAME ?? "openrelayproject",
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL ?? "openrelayproject",
    },
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
  replaceVideoTrack: (track: MediaStreamTrack | null) => Promise<void>;
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

  // WeakMap tracks the video RTCRtpSender per RTCPeerConnection.
  // We use a WeakMap instead of looking up sender.track.kind so we can still
  // find the right sender even after replaceTrack(null) sets sender.track to
  // null (a valid operation used when the camera is stopped to release the
  // hardware and turn off the indicator LED).
  const videoSenders = useRef<WeakMap<RTCPeerConnection, RTCRtpSender>>(
    new WeakMap(),
  );

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localPreviewStream, setLocalPreviewStream] =
    useState<MediaStream | null>(null);

  const sendRef = useRef(send);
  const localStreamRef = useRef(localStream);

  // Keep refs current for async callbacks (WS, ICE) without re-rendering.
  useEffect(() => {
    sendRef.current = send;
    localStreamRef.current = localStream;
  });

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

    // Add local camera/mic tracks. Keep a reference to the video sender so we
    // can update it later via replaceVideoTrack() without relying on
    // sender.track.kind (which becomes null after replaceTrack(null)).
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => {
        const sender = pc.addTrack(track, stream);
        if (track.kind === "video") {
          videoSenders.current.set(pc, sender);
        }
      });
    }

    // If screen sharing is already active, replace camera track with screen.
    if (screenTrackRef.current) {
      const sender = videoSenders.current.get(pc);
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

  // ── Retroactive track injection ────────────────────────────────────────────
  // Handles two edge cases:
  //  1. PCs created before localStream was ready (no senders yet) — add all
  //     tracks and re-negotiate with a fresh offer.
  //  2. PCs created with stopped/ended tracks (React Strict Mode runs the effect
  //     cleanup before re-mounting, calling stopMedia() which ends all tracks on
  //     the inherited lobby stream). Replace each dead sender in-place via
  //     replaceTrack(), which does not require renegotiation.
  useEffect(() => {
    if (!localStream) return;
    for (const [remoteId, pc] of peerConnections.current.entries()) {
      const senders = pc.getSenders();

      if (senders.length === 0) {
        localStream.getTracks().forEach((track) => {
          const sender = pc.addTrack(track, localStream);
          if (track.kind === "video") {
            videoSenders.current.set(pc, sender);
          }
        });
        void pc
          .createOffer()
          .then((offer) => pc.setLocalDescription(offer).then(() => offer))
          .then((offer) =>
            sendRef.current({
              event: "offer",
              targetClientId: remoteId,
              sdp: offer,
            }),
          )
          .catch(() => {});
        continue;
      }

      const hasDeadTracks = senders.some(
        (s) => !s.track || s.track.readyState === "ended",
      );
      if (!hasDeadTracks) continue;

      for (const sender of senders) {
        if (!sender.track || sender.track.readyState !== "ended") continue;
        const replacement = localStream
          .getTracks()
          .find((t) => t.kind === sender.track!.kind);
        if (replacement) {
          void sender.replaceTrack(replacement);
          if (replacement.kind === "video") {
            videoSenders.current.set(pc, sender);
          }
        }
      }
    }
  }, [localStream]);

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
    // Restore camera track (or null if video is currently off).
    // replaceTrack(null) is valid per spec and clears the sender without
    // requiring SDP renegotiation.
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0] ?? null;
    for (const pc of peerConnections.current.values()) {
      const sender = videoSenders.current.get(pc);
      if (sender) void sender.replaceTrack(cameraTrack);
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
        const sender = videoSenders.current.get(pc);
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

  // ── Video track replacement ───────────────────────────────────────────────
  // Called by MeetingRoom.handleToggleVideo after toggleVideo() stops or
  // restarts the camera track. Updates all active RTCRtpSenders so remote
  // peers see the correct video state without SDP renegotiation.
  // Passing null clears the sender (camera off); passing a live track resumes.
  const replaceVideoTrack = useCallback(
    async (track: MediaStreamTrack | null): Promise<void> => {
      for (const pc of peerConnections.current.values()) {
        const sender = videoSenders.current.get(pc);
        if (sender) {
          try {
            await sender.replaceTrack(track);
          } catch {
            // Sender may be closed (e.g. peer disconnected) — safe to ignore
          }
        }
      }
    },
    [],
  );

  return {
    handleSignal,
    handleExistingParticipants,
    handleParticipantLeft,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    localPreviewStream,
    replaceVideoTrack,
  };
}
