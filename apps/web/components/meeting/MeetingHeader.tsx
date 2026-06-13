"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { CopyInviteLink } from "@/components/meeting/CopyInviteLink";
import { formatMeetingCode } from "@/lib/meeting-code";

interface MeetingHeaderProps {
  title: string;
  meetingCode: string;
  inviteLink: string | null;
  isConnected: boolean;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function MeetingHeader({
  title,
  meetingCode,
  inviteLink,
  isConnected,
}: MeetingHeaderProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="bg-[#1c1c1c] border-b border-[#2a2a2a] px-3 sm:px-5 h-12 sm:h-14 flex items-center justify-between shrink-0 gap-3">
      {/* ── Left: meeting title + security indicator ─────────────────────── */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Lock — indicates end-to-end encrypted / secured */}
        <div
          className="shrink-0 flex items-center gap-1 text-[#5a9e5c]"
          title="Meeting is secured"
        >
          <Lock className="w-3.5 h-3.5" />
        </div>

        <div className="min-w-0">
          {/* Meeting title */}
          <p className="text-white text-sm font-semibold leading-tight truncate max-w-[180px] sm:max-w-xs">
            {title}
          </p>
          {/* Meeting code */}
          <p className="text-[#888] text-xs font-mono leading-tight">
            {formatMeetingCode(meetingCode)}
          </p>
        </div>
      </div>

      {/* ── Right: invite button + connection dot + timer ────────────────── */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <CopyInviteLink
          meeting={{ meeting_code: meetingCode, invite_link: inviteLink }}
          variant="header"
        />

        {/* Connection indicator */}
        <div className="flex items-center gap-1.5 pl-1 border-l border-[#333]">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isConnected ? "bg-green-400" : "bg-yellow-500 animate-pulse"
            }`}
            title={isConnected ? "Connected" : "Connecting…"}
          />
          <span className="text-[#888] text-xs sm:text-sm font-mono tabular-nums">
            {formatElapsed(elapsed)}
          </span>
        </div>
      </div>
    </header>
  );
}
