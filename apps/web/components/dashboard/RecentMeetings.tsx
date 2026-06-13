"use client";

import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";
import { ZoomButton } from "@/components/ui/zoom-button";
import { parseApiDateTime } from "@/lib/datetime";
import { DEFAULT_DISPLAY_NAME } from "@/lib/constants";
import type { RecentMeeting } from "@/lib/types";

function formatDisplayTime(rm: RecentMeeting): string {
  if (rm.list_type === "missed" && rm.meeting.scheduled_start_time) {
    return format(
      parseApiDateTime(rm.meeting.scheduled_start_time),
      "MMM d, h:mm a",
    );
  }
  if (rm.joined_at) {
    return formatDistanceToNow(parseApiDateTime(rm.joined_at), {
      addSuffix: true,
    });
  }
  return "";
}

interface RecentMeetingsProps {
  meetings: RecentMeeting[];
}

export function RecentMeetings({ meetings }: RecentMeetingsProps) {
  const router = useRouter();

  function handleRejoin(code: string) {
    router.push(
      `/meeting/${code}?name=${encodeURIComponent(DEFAULT_DISPLAY_NAME)}`,
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-3">
        Previous Meetings
      </h2>
      {meetings.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No previous meetings yet.
        </p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          {meetings.map((rm, i) => (
            <div
              key={`${rm.list_type}-${rm.id}`}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-card hover:bg-muted/40 transition ${
                i !== 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {rm.meeting.title}
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                  <span>
                    {rm.list_type === "missed"
                      ? `Scheduled ${formatDisplayTime(rm)}`
                      : formatDisplayTime(rm)}
                  </span>
                  {rm.meeting.duration_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {rm.meeting.duration_minutes} min
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {rm.list_type === "missed" && (
                  <span className="text-xs font-medium text-orange-600 bg-orange-500/10 border border-orange-500/30 rounded-full px-2 py-0.5">
                    Missed
                  </span>
                )}
                {rm.meeting.status === "live" && rm.list_type === "joined" && (
                  <span className="text-xs font-medium text-green-500 bg-green-500/10 border border-green-500/30 rounded-full px-2 py-0.5">
                    Live
                  </span>
                )}
                {rm.meeting.status === "ended" ? (
                  <span className="text-xs font-medium text-muted-foreground bg-muted border border-border rounded-full px-2 py-0.5">
                    Ended
                  </span>
                ) : (
                  <ZoomButton
                    size="sm"
                    variant={
                      rm.meeting.status === "live" ? "default" : "outline"
                    }
                    onClick={() => handleRejoin(rm.meeting.meeting_code)}
                  >
                    {rm.meeting.status === "live"
                      ? "Rejoin"
                      : rm.list_type === "missed"
                        ? "Start"
                        : "Start"}
                  </ZoomButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
