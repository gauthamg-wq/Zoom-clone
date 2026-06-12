"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";
import { ZoomButton } from "@/components/ui/zoom-button";
import { api } from "@/lib/api";
import { DEFAULT_DISPLAY_NAME } from "@/lib/constants";
import type { RecentMeeting } from "@/lib/types";

interface RecentMeetingsProps {
  meetings: RecentMeeting[];
}

export function RecentMeetings({ meetings }: RecentMeetingsProps) {
  const router = useRouter();
  const [joining, setJoining] = useState<string | null>(null);

  async function handleStart(code: string) {
    setJoining(code);
    try {
      const { participant } = await api.joinMeeting(code, DEFAULT_DISPLAY_NAME);
      router.push(
        `/meeting/${code}?name=${encodeURIComponent(DEFAULT_DISPLAY_NAME)}&participantId=${participant.id}`,
      );
    } catch {
      setJoining(null);
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-3">
        Previous Meetings
      </h2>
      {meetings.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No recent meetings yet.
        </p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          {meetings.map((rm, i) => (
            <div
              key={rm.id}
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
                    {formatDistanceToNow(new Date(rm.joined_at), {
                      addSuffix: true,
                    })}
                  </span>
                  {rm.meeting.duration_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {rm.meeting.duration_minutes} min
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                <ZoomButton
                  size="sm"
                  variant="outline"
                  onClick={() => handleStart(rm.meeting.meeting_code)}
                  disabled={joining === rm.meeting.meeting_code}
                >
                  {joining === rm.meeting.meeting_code ? "Joining…" : "Start"}
                </ZoomButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
