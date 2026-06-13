"use client";

import { Crown, Mic, MicOff, UserX, VideoOff, X } from "lucide-react";
import { CopyInviteLink } from "@/components/meeting/CopyInviteLink";
import type { Meeting, RemoteParticipant, WSMessage } from "@/lib/types";

interface ParticipantsSidebarProps {
  meeting: Pick<Meeting, "meeting_code" | "invite_link">;
  localName: string;
  isHost: boolean;
  remoteParticipants: RemoteParticipant[];
  send: (message: WSMessage) => void;
  onClose: () => void;
}

export function ParticipantsSidebar({
  meeting,
  localName,
  isHost,
  remoteParticipants,
  send,
  onClose,
}: ParticipantsSidebarProps) {
  const total = 1 + remoteParticipants.length;

  function handleMute(p: RemoteParticipant) {
    if (!p.is_muted) {
      send({ event: "mute-participant", targetClientId: p.clientId });
    }
  }

  function handleRemove(p: RemoteParticipant) {
    const confirmed = window.confirm(
      `Remove ${p.displayName} from the meeting?`,
    );
    if (confirmed) {
      send({ event: "remove-participant", targetClientId: p.clientId });
    }
  }

  return (
    <aside className="fixed inset-x-0 bottom-0 h-80 sm:relative sm:inset-auto sm:bottom-auto sm:h-auto sm:w-72 bg-[#1c1c1c] border-t sm:border-t-0 sm:border-l border-[#2a2a2a] flex flex-col shrink-0 z-40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-[#2a2a2a] shrink-0">
        <span className="font-semibold text-white text-sm">
          Participants ({total})
        </span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-white/10 transition"
          aria-label="Close participants"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Invite row */}
      <div className="px-3 py-2.5 border-b border-[#2a2a2a]">
        <CopyInviteLink meeting={meeting} variant="panel" />
      </div>

      {/* Participant list */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* ── Local user (always first) ───────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition group">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#0b5cff] to-[#0d4bcf] flex items-center justify-center text-white text-xs font-semibold shrink-0 select-none">
            {localName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-white font-medium truncate">
                {localName}
              </span>
              <span className="text-[11px] text-[#555] shrink-0">(You)</span>
              {isHost && <Crown className="w-3 h-3 text-yellow-400 shrink-0" />}
            </div>
            <span className="text-xs text-[#666]">
              {isHost ? "Host" : "Participant"}
            </span>
          </div>
        </div>

        {/* ── Remote participants ────────────────────────────────────── */}
        {remoteParticipants.length === 0 ? (
          <p className="text-xs text-[#555] px-4 py-3">
            No other participants yet.
          </p>
        ) : (
          remoteParticipants.map((p) => (
            <div
              key={p.clientId}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition group"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#3a3a3a] to-[#2a2a2a] flex items-center justify-center text-white text-xs font-semibold shrink-0 select-none">
                {p.displayName.charAt(0).toUpperCase()}
              </div>

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-white font-medium truncate">
                    {p.displayName}
                  </span>
                  {p.role === "host" && (
                    <Crown className="w-3 h-3 text-yellow-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#666] capitalize">
                    {p.role}
                  </span>
                  {p.is_muted && (
                    <MicOff className="w-2.5 h-2.5 text-red-400" />
                  )}
                  {!p.is_video_on && (
                    <VideoOff className="w-2.5 h-2.5 text-red-400" />
                  )}
                </div>
              </div>

              {/* Media state icons + host controls */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Always-visible mute indicator */}
                <span
                  title={p.is_muted ? "Muted" : "Unmuted"}
                  className={p.is_muted ? "text-red-400" : "text-[#5a9e5c]"}
                >
                  {p.is_muted ? (
                    <MicOff className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </span>

                {/* Host-only controls (appear on row hover) */}
                {isHost && p.role !== "host" && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleMute(p)}
                      disabled={p.is_muted}
                      title="Mute"
                      className="p-1 rounded text-[#888] hover:text-orange-400 hover:bg-white/10 transition disabled:opacity-30"
                    >
                      <MicOff className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRemove(p)}
                      title="Remove from meeting"
                      className="p-1 rounded text-[#888] hover:text-red-400 hover:bg-white/10 transition"
                    >
                      <UserX className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
