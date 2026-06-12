"use client";

import { cn } from "@/lib/utils";
import type { RemoteParticipant } from "@/lib/types";
import { VideoTile } from "./VideoTile";

interface VideoGridProps {
  localStream: MediaStream | null;
  localName: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing?: boolean;
  remoteParticipants?: RemoteParticipant[];
  remoteStreams?: Map<string, MediaStream>;
}

export function VideoGrid({
  localStream,
  localName,
  isMuted,
  isVideoOn,
  isScreenSharing = false,
  remoteParticipants = [],
  remoteStreams = new Map(),
}: VideoGridProps) {
  const totalCount = 1 + remoteParticipants.length;

  const gridClass = cn(
    "w-full h-full p-4 gap-3",
    totalCount === 1 && "flex items-center justify-center",
    totalCount === 2 && "grid grid-cols-2",
    totalCount >= 3 && "grid grid-cols-2",
  );

  const tileSize =
    totalCount === 1 ? "large" : totalCount <= 4 ? "normal" : "small";

  return (
    <div className={cn("meeting-bg flex-1 overflow-auto", gridClass)}>
      {/* Local tile — shows screen stream when sharing, camera otherwise */}
      <div className={totalCount === 1 ? "w-full max-w-2xl aspect-video" : ""}>
        <VideoTile
          stream={localStream}
          displayName={localName}
          isMuted={isMuted}
          isVideoOn={isScreenSharing ? true : isVideoOn}
          isLocal
          isHost
          size={tileSize}
        />
      </div>

      {/* Remote tiles — stream arrives via ontrack once WebRTC connects */}
      {remoteParticipants.map((p) => (
        <VideoTile
          key={p.clientId}
          stream={remoteStreams.get(p.clientId) ?? null}
          displayName={p.displayName}
          isMuted={p.is_muted}
          isVideoOn={p.is_video_on}
          isHost={p.role === "host"}
          size={tileSize}
        />
      ))}
    </div>
  );
}
