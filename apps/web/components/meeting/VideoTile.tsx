"use client";

import { useEffect, useRef, useState } from "react";
import { Crown, Maximize, Minimize, MicOff, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoTileProps {
  stream: MediaStream | null;
  displayName: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isLocal?: boolean;
  isHost?: boolean;
  isScreenShare?: boolean;
  size?: "large" | "normal" | "small";
}

export function VideoTile({
  stream,
  displayName,
  isMuted,
  isVideoOn,
  isLocal = false,
  isHost = false,
  isScreenShare = false,
  size = "normal",
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Attach the stream whenever it changes
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream;
    return () => {
      if (el) el.srcObject = null;
    };
  }, [stream]);

  // Always call play() when a stream arrives so audio flows even when the
  // video panel is hidden (isVideoOn = false).  Some browsers won't fire
  // autoPlay for a hidden element, so an explicit play() call is needed.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;
    void el.play().catch(() => {});
  }, [stream]);

  // Track whether this specific container is the active fullscreen element
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  const name = displayName || "Participant";
  const initial = name.charAt(0).toUpperCase();

  // Avatar gradient colours cycle by first letter for visual variety
  const avatarColor = "bg-gradient-to-br from-[#0b5cff] to-[#0d4bcf]";

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative overflow-hidden rounded-lg flex items-center justify-center",
        "bg-[#2d2d2d]",
        size === "large" ? "aspect-video w-full" : "h-full w-full min-h-[80px]",
        isScreenShare && "bg-[#1a1a1a]",
      )}
    >
      {/* Video — object-contain for screen share, object-cover for camera */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={cn(
          "w-full h-full",
          isScreenShare ? "object-contain" : "object-cover",
          !isVideoOn && "hidden",
        )}
      />

      {/* Avatar fallback when camera is off */}
      {!isVideoOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div
            className={cn(
              "rounded-full flex items-center justify-center text-white font-semibold select-none shadow-lg",
              avatarColor,
              size === "small" ? "w-10 h-10 text-base" : "w-16 h-16 text-2xl",
            )}
          >
            {initial}
          </div>
          {size !== "small" && (
            <span className="text-xs text-[#888] mt-1 select-none">{name}</span>
          )}
        </div>
      )}

      {/* ── Screen-share top badge ───────────────────────────────────────── */}
      {isScreenShare && (
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/55 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
          <Monitor className="w-3 h-3 shrink-0" />
          <span>{isLocal ? "Your screen" : `${name}'s screen`}</span>
        </div>
      )}

      {/* ── Host crown (non-screen-share tiles only) ─────────────────────── */}
      {isHost && !isScreenShare && (
        <div className="absolute top-2 left-2">
          <Crown className="w-4 h-4 text-yellow-400 drop-shadow" />
        </div>
      )}

      {/* ── Bottom overlay: mute badge + name label ──────────────────────── */}
      {!isScreenShare && (
        <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 flex items-end justify-between">
          {/* Left: mute icon + name */}
          <div className="flex items-center gap-1 min-w-0">
            {isMuted && (
              <span className="shrink-0 bg-black/60 rounded-full p-0.5 backdrop-blur-sm">
                <MicOff className="w-[11px] h-[11px] text-red-400" />
              </span>
            )}
            <span className="text-xs text-white bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm truncate max-w-[120px]">
              {isLocal ? `${name} (You)` : name}
            </span>
          </div>
        </div>
      )}

      {/* ── Fullscreen toggle ─────────────────────────────────────────────── */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit full screen" : "Full screen"}
        aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
        className={cn(
          "absolute bottom-2 right-2 p-1.5 rounded-md bg-black/55 text-white backdrop-blur-sm",
          "transition-opacity hover:bg-black/80",
          isScreenShare ? "opacity-90" : "opacity-0 group-hover:opacity-100",
        )}
      >
        {isFullscreen ? (
          <Minimize className="w-3.5 h-3.5" />
        ) : (
          <Maximize className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
