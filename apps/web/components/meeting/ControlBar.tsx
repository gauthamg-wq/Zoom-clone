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
  className,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer",
        active
          ? "bg-gray-700 hover:bg-gray-600 text-white"
          : "bg-red-600 hover:bg-red-500 text-white",
        className,
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
    /*
     * Layout: justify-between keeps media controls on the left and Leave/End
     * anchored to the right WITHOUT overflow scrolling.  Scrollable containers
     * on touch screens delay or swallow tap events while the browser decides
     * whether the gesture is a scroll — removing overflow-x-auto fixes that.
     *
     * Button counts on mobile: Mic + Video + Participants + Chat = 4 × 36px
     * + 3 × 6px gaps = 162px.  The right section (Leave / End) needs ~90px.
     * Total ≈ 260px which easily fits a 375px phone screen.
     */
    <footer className="bg-gray-900 border-t border-gray-800 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-5 shrink-0">
      {/* ── Left: media + utility controls ─────────────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <ControlButton
          onClick={onToggleAudio}
          active={!isMuted}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </ControlButton>

        <ControlButton
          onClick={onToggleVideo}
          active={isVideoOn}
          title={isVideoOn ? "Stop Video" : "Start Video"}
        >
          {isVideoOn ? (
            <Video className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </ControlButton>

        {/* getDisplayMedia is not supported in mobile browsers — hide on xs */}
        <ControlButton
          onClick={onToggleScreenShare}
          active={!isScreenSharing}
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
          className="hidden sm:flex"
        >
          {isScreenSharing ? (
            <MonitorX className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </ControlButton>

        <ControlButton onClick={onToggleSidebar} title="Participants">
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
        </ControlButton>

        <div className="relative">
          <ControlButton onClick={onToggleChat} title="Chat">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </ControlButton>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 leading-none pointer-events-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        {isHost && onMuteAll && (
          <ControlButton
            onClick={onMuteAll}
            title="Mute All Participants"
            className="hidden sm:flex"
          >
            <UserX className="w-4 h-4 sm:w-5 sm:h-5" />
          </ControlButton>
        )}
      </div>

      {/* ── Right: Leave / End — always visible ─────────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {isHost ? (
          <>
            {/* "Leave" as a subtle text button saves horizontal space for the End button */}
            <button
              onClick={onLeave}
              className="cursor-pointer text-red-400 hover:text-red-300 transition-colors text-xs sm:text-sm font-medium px-1.5 sm:px-2 py-1 rounded"
            >
              Leave
            </button>
            <button
              onClick={onEnd}
              className="cursor-pointer bg-red-600 hover:bg-red-500 active:bg-red-700 text-white transition-colors text-xs sm:text-sm font-semibold rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 leading-none"
            >
              End
            </button>
          </>
        ) : (
          <button
            onClick={onLeave}
            className="cursor-pointer bg-red-600 hover:bg-red-500 active:bg-red-700 text-white transition-colors text-xs sm:text-sm font-semibold rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 leading-none"
          >
            Leave
          </button>
        )}
      </div>
    </footer>
  );
}
