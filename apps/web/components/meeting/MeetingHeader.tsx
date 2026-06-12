"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { ZoomButton } from "@/components/ui/zoom-button";

interface MeetingHeaderProps {
  meetingCode: string;
  isHost: boolean;
  onLeave: () => void;
  onEnd: () => void;
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
  isHost,
  onLeave,
  onEnd,
}: MeetingHeaderProps) {
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  function handleCopyCode() {
    navigator.clipboard.writeText(meetingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-4 h-14 flex items-center justify-between shrink-0">
      {/* Meeting code */}
      <button
        onClick={handleCopyCode}
        className="flex items-center gap-2 text-gray-300 hover:text-white transition group"
        title="Click to copy meeting code"
      >
        <span className="font-mono text-sm">{meetingCode}</span>
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
        )}
      </button>

      {/* Timer */}
      <span className="text-gray-300 text-sm font-mono tabular-nums">
        {formatElapsed(elapsed)}
      </span>

      {/* Leave / End */}
      <div>
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
            Leave
          </ZoomButton>
        )}
      </div>
    </header>
  );
}
