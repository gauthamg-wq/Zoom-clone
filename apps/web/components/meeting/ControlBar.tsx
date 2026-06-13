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

/**
 * Zoom-style control button: icon on top, label below.
 * isOff = feature disabled (mic muted, video off, screen sharing active)
 *   → icon and label rendered in red to signal "active warning state"
 */
function ControlBtn({
  onClick,
  icon,
  label,
  isOff = false,
  title,
  className,
  children: _,
  badge,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isOff?: boolean;
  title?: string;
  className?: string;
  children?: never;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      title={title ?? label}
      className={cn(
        "relative flex flex-col items-center justify-center gap-[5px]",
        "min-w-[52px] sm:min-w-[60px] px-1 sm:px-2 py-2 rounded-xl",
        "hover:bg-white/9 transition-colors cursor-pointer shrink-0 select-none",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center",
          isOff ? "text-red-500" : "text-white",
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          "text-[11px] font-medium leading-none text-center whitespace-nowrap",
          isOff ? "text-red-400" : "text-[#c0c0c0]",
        )}
      >
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 leading-none pointer-events-none">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
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
  const iconSize = "w-[22px] h-[22px]";

  return (
    /*
     * Layout: flex with two flex-1 spacers flanking the centered controls,
     * and the Leave/End section anchored at the right inside its own spacer.
     * This keeps the icon strip perfectly centred on any screen width without
     * using `position: absolute`, which would cause clipping on small screens.
     */
    <footer className="bg-[#1c1c1c] border-t border-[#2a2a2a] h-[72px] flex items-center px-3 sm:px-5 shrink-0 gap-2">
      {/* ── Left flex-1 spacer: keeps center strip centred ─────────────── */}
      <div className="flex-1 min-w-0" />

      {/* ── Center: primary controls ─────────────────────────────────────── */}
      <div className="flex items-center gap-0 sm:gap-0.5">
        <ControlBtn
          onClick={onToggleAudio}
          icon={
            isMuted ? (
              <MicOff className={iconSize} />
            ) : (
              <Mic className={iconSize} />
            )
          }
          label={isMuted ? "Unmute" : "Mute"}
          isOff={isMuted}
        />

        <ControlBtn
          onClick={onToggleVideo}
          icon={
            isVideoOn ? (
              <Video className={iconSize} />
            ) : (
              <VideoOff className={iconSize} />
            )
          }
          label={isVideoOn ? "Stop Video" : "Start Video"}
          isOff={!isVideoOn}
        />

        {/* Screen share: hidden on mobile browsers that don't support getDisplayMedia */}
        <ControlBtn
          onClick={onToggleScreenShare}
          icon={
            isScreenSharing ? (
              <MonitorX className={iconSize} />
            ) : (
              <Monitor className={iconSize} />
            )
          }
          label={isScreenSharing ? "Stop Share" : "Share Screen"}
          isOff={isScreenSharing}
          className="hidden sm:flex"
        />

        <ControlBtn
          onClick={onToggleSidebar}
          icon={<Users className={iconSize} />}
          label="Participants"
        />

        <ControlBtn
          onClick={onToggleChat}
          icon={<MessageSquare className={iconSize} />}
          label="Chat"
          badge={unreadCount}
        />

        {isHost && onMuteAll && (
          <ControlBtn
            onClick={onMuteAll}
            icon={<UserX className={iconSize} />}
            label="Mute All"
            className="hidden sm:flex"
          />
        )}
      </div>

      {/* ── Right flex-1 spacer: Leave/End anchored to the right ────────── */}
      <div className="flex-1 min-w-0 flex items-center justify-end gap-2 shrink-0">
        {isHost ? (
          <>
            {/* Ghost "Leave" so the host can hand off and step out */}
            <button
              onClick={onLeave}
              className="cursor-pointer text-white text-sm font-medium px-3 py-1.5 rounded-lg border border-[#444] hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Leave
            </button>
            {/* Prominent red "End for all" */}
            <button
              onClick={onEnd}
              className="cursor-pointer bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              End
            </button>
          </>
        ) : (
          <button
            onClick={onLeave}
            className="cursor-pointer bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Leave
          </button>
        )}
      </div>
    </footer>
  );
}
