"use client";

import { Crown, MicOff, UserX, VideoOff, X } from "lucide-react";
import type { RemoteParticipant, WSMessage } from "@/lib/types";

interface ParticipantsSidebarProps {
  meetingCode: string;
  localName: string;
  isHost: boolean;
  remoteParticipants: RemoteParticipant[];
  send: (message: WSMessage) => void;
  onClose: () => void;
}

export function ParticipantsSidebar({
  localName,
  isHost,
  remoteParticipants,
  send,
  onClose,
}: ParticipantsSidebarProps) {
  // Total = local user + remote participants
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
    <aside className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="font-semibold text-white text-sm">
          Participants ({total})
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Local user (always first) */}
        <div className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0 select-none">
            {localName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-white truncate">{localName}</span>
              {isHost && <Crown className="w-3 h-3 text-yellow-400 shrink-0" />}
            </div>
            <span className="text-xs text-gray-500">
              {isHost ? "host" : "participant"} · You
            </span>
          </div>
        </div>

        {/* Remote participants */}
        {remoteParticipants.length === 0 ? (
          <p className="text-xs text-gray-500 px-4 py-2">
            No other participants yet.
          </p>
        ) : (
          remoteParticipants.map((p) => (
            <div
              key={p.clientId}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition group"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-primary/70 flex items-center justify-center text-white text-xs font-semibold shrink-0 select-none">
                {p.displayName.charAt(0).toUpperCase()}
              </div>

              {/* Name + role */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-white truncate">
                    {p.displayName}
                  </span>
                  {p.role === "host" && (
                    <Crown className="w-3 h-3 text-yellow-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 capitalize">
                    {p.role}
                  </span>
                  {p.is_muted && <MicOff className="w-3 h-3 text-red-400" />}
                  {!p.is_video_on && (
                    <VideoOff className="w-3 h-3 text-red-400" />
                  )}
                </div>
              </div>

              {/* Host controls */}
              {isHost && p.role !== "host" && (
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleMute(p)}
                    disabled={p.is_muted}
                    title="Mute participant"
                    className="p-1 rounded text-gray-400 hover:text-orange-400 hover:bg-gray-700 transition disabled:opacity-30"
                  >
                    <MicOff className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemove(p)}
                    title="Remove participant"
                    className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-gray-700 transition"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
