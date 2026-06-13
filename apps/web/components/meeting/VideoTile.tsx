"use client";

import { useEffect, useRef } from "react";
import { MicOff, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoTileProps {
  stream: MediaStream | null;
  displayName: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isLocal?: boolean;
  isHost?: boolean;
  size?: "large" | "normal" | "small";
}

export function VideoTile({
  stream,
  displayName,
  isMuted,
  isVideoOn,
  isLocal = false,
  isHost = false,
  size = "normal",
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach the stream to the video element whenever it changes
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream;
    return () => {
      if (el) el.srcObject = null;
    };
  }, [stream]);

  // Browsers don't re-trigger autoPlay when a hidden (display:none) element
  // becomes visible. Call play() explicitly whenever the video should be shown
  // or whenever a new stream is attached while the video is already visible.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isVideoOn || !stream) return;
    void el.play().catch(() => {
      // Autoplay policy may block in certain contexts; safe to ignore
    });
  }, [isVideoOn, stream]);

  const name = displayName || "Participant";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center",
        // "large" keeps a fixed 16:9 ratio (solo tile); other sizes fill their
        // grid cell so they adapt to available height on any screen size.
        size === "large" ? "aspect-video w-full" : "h-full w-full min-h-[80px]",
      )}
    >
      {/* Video element — always mounted so srcObject assignment works */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={cn("w-full h-full object-cover", !isVideoOn && "hidden")}
      />

      {/* Avatar fallback when video is off */}
      {!isVideoOn && (
        <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-semibold select-none">
            {initial}
          </div>
        </div>
      )}

      {/* Host crown */}
      {isHost && (
        <div className="absolute top-2 left-2">
          <Crown className="w-4 h-4 text-yellow-400 drop-shadow" />
        </div>
      )}

      {/* Mute indicator */}
      {isMuted && (
        <div className="absolute top-2 right-2 bg-red-600 rounded-full p-1">
          <MicOff className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1">
        <span className="text-xs text-white bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
          {isLocal ? "You" : name}
        </span>
      </div>
    </div>
  );
}
