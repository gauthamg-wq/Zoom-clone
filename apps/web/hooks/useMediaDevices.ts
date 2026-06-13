"use client";

import { useCallback, useRef, useState } from "react";

interface StartMediaOptions {
  /** Restore lobby mute preference when Strict Mode forces a fresh stream. */
  isMuted?: boolean;
  /** Restore lobby video preference when Strict Mode forces a fresh stream. */
  isVideoOn?: boolean;
}

interface UseMediaDevicesReturn {
  localStream: MediaStream | null;
  isMuted: boolean;
  isVideoOn: boolean;
  error: string | null;
  toggleAudio: () => void;
  toggleVideo: () => Promise<MediaStreamTrack | null>;
  startMedia: (opts?: StartMediaOptions) => Promise<void>;
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

  const startMedia = useCallback(async (opts?: StartMediaOptions) => {
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

        // Determine the effective mute/video state:
        //   1. If the caller provides initial prefs (lobby choices forwarded after
        //      Strict Mode kills the lobby stream), honour those.
        //   2. Otherwise fall back to what the constraints imply for the device.
        //
        // This is critical in React Strict Mode: stopMedia() kills the lobby
        // stream on the first cleanup, so the second mount calls startMedia()
        // instead of initWithStream(). Without restoring the original prefs,
        // the state always resets to "unmuted + video on" regardless of what
        // the user chose in the lobby.
        const effectiveMuted = opts?.isMuted ?? !constraints.audio;
        const effectiveVideoOn = opts?.isVideoOn ?? !!constraints.video;

        // Apply preferences to the newly acquired tracks so track.enabled is
        // in sync with the state we are about to set.
        stream.getAudioTracks().forEach((t) => {
          t.enabled = !effectiveMuted;
        });
        stream.getVideoTracks().forEach((t) => {
          t.enabled = effectiveVideoOn;
        });

        setIsMuted(effectiveMuted);
        setIsVideoOn(effectiveVideoOn);

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

  // Toggles the camera properly:
  // OFF → stop the track entirely so the camera hardware is released (LED off).
  // ON  → request a fresh camera track via getUserMedia and add it to the stream.
  //
  // Returns the new video track (when turning ON) or null (when turning OFF /
  // on error). Callers (MeetingRoom) must call replaceVideoTrack() in useWebRTC
  // with the returned value so all RTCRtpSenders are updated accordingly.
  const toggleVideo =
    useCallback(async (): Promise<MediaStreamTrack | null> => {
      const stream = streamRef.current;
      if (!stream) return null;

      const videoTracks = stream.getVideoTracks();

      if (isVideoOn) {
        // Turn OFF: stop each camera track so the OS releases the hardware.
        // Using track.enabled = false only hides the frames but keeps the camera
        // running (LED stays on). track.stop() actually powers it down.
        videoTracks.forEach((t) => {
          t.stop();
          stream.removeTrack(t);
        });
        setIsVideoOn(false);
        return null;
      } else {
        // Turn ON: re-acquire the camera (audio: false — don't touch the mic).
        try {
          const camStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          const newTrack = camStream.getVideoTracks()[0];
          if (newTrack) {
            stream.addTrack(newTrack);
            setIsVideoOn(true);
            return newTrack;
          }
        } catch {
          setError("Camera is unavailable.");
        }
        return null;
      }
    }, [isVideoOn]);

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
