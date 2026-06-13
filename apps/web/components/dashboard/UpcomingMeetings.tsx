"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isToday, isTomorrow } from "date-fns";
import { Clock, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { ZoomButton } from "@/components/ui/zoom-button";
import { parseApiDateTime } from "@/lib/datetime";
import { getInviteLink } from "@/lib/invite-link";
import { hasMeetingStarted, isMeetingWindowOpen } from "@/lib/meeting-window";
import { DEFAULT_DISPLAY_NAME } from "@/lib/constants";
import type { Meeting } from "@/lib/types";

function formatMeetingTime(iso: string): string {
  const date = parseApiDateTime(iso);
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
  const [copied, setCopied] = useState<string | null>(null);

  function handleStart(meeting: Meeting) {
    router.push(
      `/meeting/${meeting.meeting_code}?name=${encodeURIComponent(DEFAULT_DISPLAY_NAME)}`,
    );
  }

  async function handleCopy(meeting: Meeting) {
    const link = getInviteLink(meeting);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(meeting.meeting_code);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Could not copy invite link");
    }
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
          {meetings.map((m, i) => {
            const started = hasMeetingStarted(m);
            const inWindow = isMeetingWindowOpen(m);

            return (
              <div
                key={m.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-card hover:bg-muted/40 transition ${
                  i !== 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">
                      {m.title}
                    </p>
                    {started && inWindow && (
                      <span className="text-xs font-medium text-orange-600 bg-orange-500/10 border border-orange-500/30 rounded-full px-2 py-0.5 shrink-0">
                        Ready to start
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                    {m.scheduled_start_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatMeetingTime(m.scheduled_start_time)}
                      </span>
                    )}
                    {m.duration_minutes && (
                      <span>{m.duration_minutes} min</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => void handleCopy(m)}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition"
                    title="Copy invite link"
                  >
                    {copied === m.meeting_code ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <ZoomButton size="sm" onClick={() => handleStart(m)}>
                    Start
                  </ZoomButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
