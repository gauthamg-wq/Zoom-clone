import { API_URL } from "@/lib/constants";
import type { Meeting } from "@/lib/types";
import { MeetingPageClient } from "./MeetingPageClient";

async function fetchMeeting(code: string): Promise<Meeting | null> {
  try {
    const res = await fetch(`${API_URL}/meetings/${code}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<Meeting>;
  } catch {
    return null;
  }
}

function MeetingNotFound({ code }: { code: string }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl">🔍</div>
        <h1 className="text-2xl font-bold text-white">Meeting not found</h1>
        <p className="text-gray-400">
          No meeting with code{" "}
          <span className="font-mono text-white">{code}</span> exists.
        </p>
        <a
          href="/dashboard"
          className="inline-block mt-2 px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}

interface PageProps {
  params: Promise<{ meetingCode: string }>;
}

export default async function MeetingPage({ params }: PageProps) {
  const { meetingCode } = await params;
  const meeting = await fetchMeeting(meetingCode);
  if (!meeting) return <MeetingNotFound code={meetingCode} />;
  return <MeetingPageClient meeting={meeting} />;
}
