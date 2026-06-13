"use client";

import { cn } from "@/lib/utils";
import type { RemoteParticipant } from "@/lib/types";
import { VideoTile } from "./VideoTile";

interface VideoGridProps {
  localStream: MediaStream | null;
  localName: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isHost?: boolean;
  isScreenSharing?: boolean;
  remoteParticipants?: RemoteParticipant[];
  remoteStreams?: Map<string, MediaStream>;
}

export function VideoGrid({
  localStream,
  localName,
  isMuted,
  isVideoOn,
  isHost = false,
  isScreenSharing = false,
  remoteParticipants = [],
  remoteStreams = new Map(),
}: VideoGridProps) {
  const totalCount = 1 + remoteParticipants.length;

  // Grid layout: tiles fill available height so the layout adapts to any screen
  // size and orientation rather than overflowing on landscape mobile.
  const gridClass = cn(
    "w-full h-full gap-2 sm:gap-3 p-2 sm:p-4",
    totalCount === 1 && "flex items-center justify-center",
    totalCount === 2 && "grid grid-cols-2 grid-rows-1",
    totalCount === 3 && "grid grid-cols-2 grid-rows-2",
    totalCount === 4 && "grid grid-cols-2 grid-rows-2",
    totalCount >= 5 && "grid grid-cols-3 grid-rows-2",
  );

  const tileSize =
    totalCount === 1 ? "large" : totalCount <= 4 ? "normal" : "small";

  return (
    <div className={cn("meeting-bg flex-1 overflow-hidden", gridClass)}>
      {/* Local tile — wraps in aspect-video container only when alone */}
      {totalCount === 1 ? (
        <div className="w-full max-w-2xl aspect-video">
          <VideoTile
            stream={localStream}
            displayName={localName}
            isMuted={isMuted}
            isVideoOn={isScreenSharing ? true : isVideoOn}
            isLocal
            isHost={isHost}
            size={tileSize}
          />
        </div>
      ) : (
        <VideoTile
          stream={localStream}
          displayName={localName}
          isMuted={isMuted}
          isVideoOn={isScreenSharing ? true : isVideoOn}
          isLocal
          isHost={isHost}
          size={tileSize}
        />
      )}

      {/* Remote tiles — stream arrives via ontrack once WebRTC connects.
          isVideoOn includes is_screen_sharing so that toggling the camera off
          while sharing a screen does not hide the screen on the remote side. */}
      {remoteParticipants.map((p) => (
        <VideoTile
          key={p.clientId}
          stream={remoteStreams.get(p.clientId) ?? null}
          displayName={p.displayName}
          isMuted={p.is_muted}
          isVideoOn={p.is_video_on || p.is_screen_sharing}
          isHost={p.role === "host"}
          size={tileSize}
        />
      ))}
    </div>
  );
}
