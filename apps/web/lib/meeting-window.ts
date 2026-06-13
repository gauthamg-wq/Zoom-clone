import type { Meeting } from "@/lib/types";
import { parseApiDateTime } from "@/lib/datetime";

const DEFAULT_DURATION_MINUTES = 30;

export function getMeetingWindowEnd(meeting: Meeting): Date | null {
  if (!meeting.scheduled_start_time) return null;
  const start = parseApiDateTime(meeting.scheduled_start_time);
  const durationMs =
    (meeting.duration_minutes ?? DEFAULT_DURATION_MINUTES) * 60 * 1000;
  return new Date(start.getTime() + durationMs);
}

export function isMeetingWindowOpen(
  meeting: Meeting,
  now = new Date(),
): boolean {
  const end = getMeetingWindowEnd(meeting);
  return end !== null && now < end;
}

export function hasMeetingStarted(meeting: Meeting, now = new Date()): boolean {
  if (!meeting.scheduled_start_time) return false;
  return parseApiDateTime(meeting.scheduled_start_time) <= now;
}
