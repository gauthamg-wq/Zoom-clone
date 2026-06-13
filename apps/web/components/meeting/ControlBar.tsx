"use client";

import {
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  MonitorX,
  Users,
  UserX,
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
  unreadCount?: number;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleSidebar: () => void;
  onToggleChat: () => void;
  onMuteAll?: () => void;
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
        "w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition shrink-0",
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
  unreadCount = 0,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleSidebar,
  onToggleChat,
  onMuteAll,
  onLeave,
  onEnd,
}: ControlBarProps) {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 h-20 flex items-center justify-between px-3 sm:px-6 shrink-0">
      {/* Left spacer — hidden on mobile to maximise control space */}
      <div className="hidden sm:flex flex-1" />

      {/* Center controls */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto max-w-full">
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

        <div className="relative">
          <ControlButton onClick={onToggleChat} title="Chat">
            <MessageSquare className="w-5 h-5" />
          </ControlButton>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none pointer-events-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        {isHost && onMuteAll && (
          <ControlButton onClick={onMuteAll} title="Mute All Participants">
            <UserX className="w-5 h-5" />
          </ControlButton>
        )}
      </div>

      {/* Right: Leave/End */}
      <div className="flex-1 flex justify-end gap-2 sm:flex-1">
        {isHost ? (
          <>
            <ZoomButton
              variant="outline"
              size="sm"
              className="border-red-600 text-red-400 hover:bg-red-600/10"
              onClick={onLeave}
            >
              Leave
            </ZoomButton>
            <ZoomButton variant="destructive" size="sm" onClick={onEnd}>
              End for All
            </ZoomButton>
          </>
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
