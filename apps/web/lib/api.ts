import { API_URL } from "@/lib/constants";
import type {
  JoinMeetingResponse,
  Meeting,
  Participant,
  RecentMeeting,
  ScheduleMeetingPayload,
} from "@/lib/types";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message: string =
      (body as { detail?: string }).detail ?? `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // cache: 'no-store' prevents the browser from serving stale meeting status
  // (e.g. showing "live" after a meeting has ended).
  getUpcomingMeetings: () =>
    apiFetch<Meeting[]>("/meetings/upcoming", { cache: "no-store" }),

  getRecentMeetings: () =>
    apiFetch<RecentMeeting[]>("/meetings/recent", { cache: "no-store" }),

  getMeeting: (code: string) => apiFetch<Meeting>(`/meetings/${code}`),

  createInstantMeeting: () =>
    apiFetch<Meeting>("/meetings/instant", { method: "POST" }),

  scheduleMeeting: (data: ScheduleMeetingPayload) =>
    apiFetch<Meeting>("/meetings/schedule", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    }),

  joinMeeting: (code: string, display_name: string) =>
    apiFetch<JoinMeetingResponse>(`/meetings/${code}/join`, {
      method: "POST",
      body: JSON.stringify({ display_name }),
      headers: { "Content-Type": "application/json" },
    }),

  endMeeting: (code: string) =>
    apiFetch<Meeting>(`/meetings/${code}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "ended" }),
      headers: { "Content-Type": "application/json" },
    }),

  getParticipants: (code: string) =>
    apiFetch<Participant[]>(`/participants/${code}`),

  leaveParticipant: (code: string, participant_id: number) =>
    apiFetch<{ ok: boolean }>(`/participants/${code}/leave`, {
      method: "POST",
      body: JSON.stringify({ participant_id }),
      headers: { "Content-Type": "application/json" },
    }),
};
