/** Resolve the shareable invite URL for a meeting. */
export function getInviteLink(meeting: {
  invite_link: string | null;
  meeting_code: string;
}): string {
  if (meeting.invite_link) return meeting.invite_link;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/meeting/${meeting.meeting_code}`;
  }
  return `/meeting/${meeting.meeting_code}`;
}
