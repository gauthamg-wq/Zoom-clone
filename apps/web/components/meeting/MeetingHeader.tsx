"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { CopyInviteLink } from "@/components/meeting/CopyInviteLink";
import { formatMeetingCode } from "@/lib/meeting-code";

interface MeetingHeaderProps {
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
    <header className="bg-gray-900 border-b border-gray-800 px-3 sm:px-5 h-12 sm:h-14 flex items-center justify-between shrink-0 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1.5 text-gray-400 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
          <span className="font-mono text-xs sm:text-sm text-gray-300">
            {formatMeetingCode(meetingCode)}
          </span>
        </div>
        <CopyInviteLink
          meeting={{ meeting_code: meetingCode, invite_link: inviteLink }}
          variant="header"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isConnected ? "bg-green-400" : "bg-yellow-500 animate-pulse"
          }`}
          title={isConnected ? "Connected" : "Connecting…"}
        />
        <span className="text-gray-400 text-xs sm:text-sm font-mono tabular-nums">
          {formatElapsed(elapsed)}
        </span>
      </div>
    </header>
  );
}
