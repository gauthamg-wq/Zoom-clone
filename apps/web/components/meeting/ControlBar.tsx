"use client";

import {
  Mic,
  MicOff,
  Monitor,
  MonitorX,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ZoomButton } from "@/components/ui/zoom-button";

interface ControlBarProps {
  isMuted: boolean;
  isVideoOn: boolean;
  isHost: boolean;
  isScreenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleSidebar: () => void;
  onLeave: () => void;
  onEnd: () => void;
}

function ControlButton({
  onClick,
  active = true,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "w-11 h-11 rounded-full flex items-center justify-center transition",
        active
          ? "bg-gray-700 hover:bg-gray-600 text-white"
          : "bg-red-600 hover:bg-red-500 text-white",
      )}
    >
      {children}
    </button>
  );
}

export function ControlBar({
  isMuted,
  isVideoOn,
  isHost,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleSidebar,
  onLeave,
  onEnd,
}: ControlBarProps) {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 h-20 flex items-center justify-between px-6 shrink-0">
      {/* Left spacer */}
      <div className="flex-1" />

      {/* Center controls */}
      <div className="flex items-center gap-3">
        <ControlButton
          onClick={onToggleAudio}
          active={!isMuted}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </ControlButton>

        <ControlButton
          onClick={onToggleVideo}
          active={isVideoOn}
          title={isVideoOn ? "Stop Video" : "Start Video"}
        >
          {isVideoOn ? (
            <Video className="w-5 h-5" />
          ) : (
            <VideoOff className="w-5 h-5" />
          )}
        </ControlButton>

        <ControlButton
          onClick={onToggleScreenShare}
          active={!isScreenSharing}
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        >
          {isScreenSharing ? (
            <MonitorX className="w-5 h-5" />
          ) : (
            <Monitor className="w-5 h-5" />
          )}
        </ControlButton>

        <ControlButton onClick={onToggleSidebar} title="Participants">
          <Users className="w-5 h-5" />
        </ControlButton>
      </div>

      {/* Right: Leave/End */}
      <div className="flex-1 flex justify-end">
        {isHost ? (
          <ZoomButton variant="destructive" size="sm" onClick={onEnd}>
            End Meeting
          </ZoomButton>
        ) : (
          <ZoomButton
            variant="outline"
            size="sm"
            className="border-red-600 text-red-400 hover:bg-red-600/10"
            onClick={onLeave}
          >
            Leave Meeting
          </ZoomButton>
        )}
      </div>
    </footer>
  );
}
