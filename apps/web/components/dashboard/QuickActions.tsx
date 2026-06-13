"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VideoOff, Plus, Calendar, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { api } from "@/lib/api";

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function QuickActions() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const now = useLiveClock();

  const timeStr = format(now, "h:mm a");
  const dayStr = format(now, "EEEE, MMMM d");
  const dayNum = format(now, "d");

  async function handleNewMeeting() {
    setStarting(true);
    try {
      const meeting = await api.createInstantMeeting();
      router.push(`/meeting/${meeting.meeting_code}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start meeting",
      );
      setStarting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 py-4">
      {/* Time / date header */}
      <div className="text-center select-none">
        <div className="text-5xl font-light tracking-tight text-foreground tabular-nums">
          {timeStr}
        </div>
        <div className="text-sm text-muted-foreground mt-1">{dayStr}</div>
      </div>

      {/* Action buttons row */}
      <div className="flex items-start justify-center gap-10 sm:gap-14">
        {/* New Meeting */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleNewMeeting}
            disabled={starting}
            aria-label="New meeting"
            className="w-[56px] h-[56px] rounded-2xl bg-[#f26a22] flex items-center justify-center shadow-[0_4px_12px_rgba(242,106,34,0.35)] hover:brightness-110 active:brightness-90 transition disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f26a22]"
          >
            <VideoOff className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-0.5">
            <span className="text-sm font-medium text-foreground">
              {starting ? "Starting…" : "New meeting"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground mt-px" />
          </div>
        </div>

        {/* Join */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => router.push("/join")}
            aria-label="Join"
            className="w-[56px] h-[56px] rounded-2xl bg-[#0b5cff] flex items-center justify-center shadow-[0_4px_12px_rgba(11,92,255,0.3)] hover:brightness-110 active:brightness-90 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b5cff]"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
          <span className="text-sm font-medium text-foreground">Join</span>
        </div>

        {/* Schedule */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => router.push("/schedule")}
            aria-label="Schedule"
            className="w-[56px] h-[56px] rounded-2xl bg-[#0b5cff] flex flex-col items-center justify-center shadow-[0_4px_12px_rgba(11,92,255,0.3)] hover:brightness-110 active:brightness-90 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b5cff]"
          >
            <Calendar className="w-5 h-5 text-white" />
            <span className="text-[10px] font-bold text-white leading-none -mt-0.5">
              {dayNum}
            </span>
          </button>
          <span className="text-sm font-medium text-foreground">Schedule</span>
        </div>
      </div>
    </div>
  );
}
