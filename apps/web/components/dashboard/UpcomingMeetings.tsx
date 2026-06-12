"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isToday, isTomorrow } from "date-fns";
import { Clock, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { ZoomButton } from "@/components/ui/zoom-button";
import { api } from "@/lib/api";
import { DEFAULT_DISPLAY_NAME } from "@/lib/constants";
import type { Meeting } from "@/lib/types";

function formatMeetingTime(iso: string): string {
  const date = new Date(iso);
  const timeStr = format(date, "h:mm a");
  if (isToday(date)) return `Today, ${timeStr}`;
  if (isTomorrow(date)) return `Tomorrow, ${timeStr}`;
  return format(date, "MMM d, ") + timeStr;
}

interface UpcomingMeetingsProps {
  meetings: Meeting[];
}

export function UpcomingMeetings({ meetings }: UpcomingMeetingsProps) {
  const router = useRouter();
  const [joining, setJoining] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleStart(meeting: Meeting) {
    setJoining(meeting.meeting_code);
    try {
      const { participant } = await api.joinMeeting(
        meeting.meeting_code,
        DEFAULT_DISPLAY_NAME,
      );
      router.push(
        `/meeting/${meeting.meeting_code}?name=${encodeURIComponent(DEFAULT_DISPLAY_NAME)}&participantId=${participant.id}`,
      );
    } catch {
      setJoining(null);
    }
  }

  async function handleCopy(meeting: Meeting) {
    if (!meeting.invite_link) return;
    await navigator.clipboard.writeText(meeting.invite_link);
    setCopied(meeting.meeting_code);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-3">
        Upcoming Meetings
      </h2>
      {meetings.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No upcoming meetings. Schedule one to get started.
        </p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          {meetings.map((m, i) => (
            <div
              key={m.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-card hover:bg-muted/40 transition ${
                i !== 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {m.title}
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                  {m.scheduled_start_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatMeetingTime(m.scheduled_start_time)}
                    </span>
                  )}
                  {m.duration_minutes && <span>{m.duration_minutes} min</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopy(m)}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition"
                  title="Copy invite link"
                >
                  {copied === m.meeting_code ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <ZoomButton
                  size="sm"
                  onClick={() => handleStart(m)}
                  disabled={joining === m.meeting_code}
                >
                  {joining === m.meeting_code ? "Joining…" : "Start"}
                </ZoomButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
