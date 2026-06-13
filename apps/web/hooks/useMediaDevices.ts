"use client";

import { useCallback, useRef, useState } from "react";

interface UseMediaDevicesReturn {
  localStream: MediaStream | null;
  isMuted: boolean;
  isVideoOn: boolean;
  error: string | null;
  toggleAudio: () => void;
  toggleVideo: () => void;
  startMedia: () => Promise<void>;
  stopMedia: () => void;
  initWithStream: (stream: MediaStream) => void;
}

export function useMediaDevices(): UseMediaDevicesReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref so stopMedia / toggle always see the latest stream
  const streamRef = useRef<MediaStream | null>(null);

  const startMedia = useCallback(async () => {
    setError(null);
    // Try full media first, then fallback to audio-only, then video-only
    const attempts: MediaStreamConstraints[] = [
      { video: true, audio: true },
      { video: false, audio: true },
      { video: true, audio: false },
    ];
    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        setLocalStream(stream);
        if (!constraints.video) setIsVideoOn(false);
        if (!constraints.audio) setIsMuted(true);
        if (JSON.stringify(constraints) !== JSON.stringify(attempts[0])) {
          const label = !constraints.video
            ? "Camera unavailable — joining with audio only."
            : "Microphone unavailable — joining with video only.";
          setError(label);
        }
        return;
      } catch {
        // Try next fallback
      }
    }
    setError(
      "Could not access camera or microphone. Check browser permissions and try again.",
    );
  }, []);

  const stopMedia = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLocalStream(null);
  }, []);

  const toggleAudio = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((prev) => !prev);
  }, []);

  const toggleVideo = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsVideoOn((prev) => !prev);
  }, []);

  // Use a stream that was already acquired (e.g. from the pre-join lobby)
  // without calling getUserMedia again.
  const initWithStream = useCallback((stream: MediaStream) => {
    streamRef.current = stream;
    setLocalStream(stream);
    setError(null);
    const audioEnabled = stream.getAudioTracks()[0]?.enabled ?? true;
    const videoEnabled = stream.getVideoTracks()[0]?.enabled ?? false;
    setIsMuted(!audioEnabled);
    setIsVideoOn(videoEnabled || stream.getVideoTracks().length === 0);
  }, []);

  return {
    localStream,
    isMuted,
    isVideoOn,
    error,
    toggleAudio,
    toggleVideo,
    startMedia,
    stopMedia,
    initWithStream,
  };
}
