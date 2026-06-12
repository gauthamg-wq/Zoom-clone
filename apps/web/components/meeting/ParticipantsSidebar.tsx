"use client";

import { useEffect, useState } from "react";
import { X, MicOff, VideoOff, Crown } from "lucide-react";
import { api } from "@/lib/api";
import type { Participant } from "@/lib/types";

interface ParticipantsSidebarProps {
  meetingCode: string;
  onClose: () => void;
}

export function ParticipantsSidebar({
  meetingCode,
  onClose,
}: ParticipantsSidebarProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getParticipants(meetingCode)
      .then(setParticipants)
      .finally(() => setLoading(false));
  }, [meetingCode]);

  return (
    <aside className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="font-semibold text-white text-sm">
          Participants ({loading ? "…" : participants.length})
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
        {loading ? (
          <p className="text-xs text-gray-500 px-4 py-2">Loading…</p>
        ) : participants.length === 0 ? (
          <p className="text-xs text-gray-500 px-4 py-2">
            No participants yet.
          </p>
        ) : (
          participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0 select-none">
                {p.display_name.charAt(0).toUpperCase()}
              </div>

              {/* Name + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-white truncate">
                    {p.display_name}
                  </span>
                  {p.role === "host" && (
                    <Crown className="w-3 h-3 text-yellow-400 shrink-0" />
                  )}
                </div>
                <span className="text-xs text-gray-500 capitalize">
                  {p.role}
                </span>
              </div>

              {/* Media icons */}
              <div className="flex items-center gap-1 shrink-0">
                {p.is_muted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                {!p.is_video_on && (
                  <VideoOff className="w-3.5 h-3.5 text-red-400" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
