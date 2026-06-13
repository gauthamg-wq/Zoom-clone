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

  /**
   * Grid layout strategy (Zoom-like):
   *
   * 1 tile  — centred, capped at 16:9, max-w-2xl
   * 2 tiles — portrait mobile: stacked (1 col × 2 rows)
   *           landscape / sm+: side-by-side (2 cols × 1 row)
   * 3–4     — 2 × 2 grid on all breakpoints (each row gets ~50% height)
   * 5+      — 2 cols on mobile, 3 cols on sm+ (2 rows)
   *
   * Every tile uses h-full/w-full so it fills its grid cell; video content
   * is kept in-frame via object-cover.
   */
  const gridClass = cn(
    "w-full h-full gap-1.5 sm:gap-2 p-1.5 sm:p-3",
    totalCount === 1 && "flex items-center justify-center",
    totalCount === 2 &&
      "grid grid-cols-1 grid-rows-2 sm:grid-cols-2 sm:grid-rows-1",
    totalCount === 3 && "grid grid-cols-2 grid-rows-2",
    totalCount === 4 && "grid grid-cols-2 grid-rows-2",
    totalCount >= 5 &&
      "grid grid-cols-2 sm:grid-cols-3 grid-rows-2 sm:grid-rows-2",
  );

  const tileSize =
    totalCount === 1 ? "large" : totalCount <= 4 ? "normal" : "small";

  return (
    <div className={cn("meeting-bg flex-1 h-full overflow-hidden", gridClass)}>
      {/* Local tile */}
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

      {/* Remote tiles.
          isVideoOn includes is_screen_sharing so the tile stays visible when
          a remote peer shares their screen with their camera off. */}
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
