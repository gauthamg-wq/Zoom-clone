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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      setLocalStream(stream);
    } catch (err: unknown) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera/microphone permission denied. Please allow access and refresh."
          : "Could not access camera or microphone.";
      setError(message);
    }
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

  return {
    localStream,
    isMuted,
    isVideoOn,
    error,
    toggleAudio,
    toggleVideo,
    startMedia,
    stopMedia,
  };
}
