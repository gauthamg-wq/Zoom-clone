import Link from "next/link";
import type { Meeting } from "@/lib/types";
import { formatMeetingCode } from "@/lib/meeting-code";

interface MeetingEndedProps {
  meeting: Meeting;
}

export function MeetingEnded({ meeting }: MeetingEndedProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-6xl">📋</div>
        <h1 className="text-2xl font-bold text-white">Meeting has ended</h1>
        <p className="text-gray-400 text-sm">
          {meeting.title} ({formatMeetingCode(meeting.meeting_code)}) is no
          longer active.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-2 px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
