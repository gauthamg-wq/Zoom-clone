import { API_URL } from "@/lib/constants";
import type { Meeting } from "@/lib/types";
import { LeftPageClient } from "./LeftPageClient";

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

interface PageProps {
  params: Promise<{ meetingCode: string }>;
}

export default async function LeftPage({ params }: PageProps) {
  const { meetingCode } = await params;
  const meeting = await fetchMeeting(meetingCode);
  return <LeftPageClient meeting={meeting} meetingCode={meetingCode} />;
}
