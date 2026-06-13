export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Meeting {
  id: number;
  meeting_code: string;
  title: string;
  description: string | null;
  host_user_id: number;
  scheduled_start_time: string | null;
  duration_minutes: number | null;
  status: "scheduled" | "live" | "ended";
  invite_link: string | null;
  created_at: string;
}

export interface Participant {
  id: number;
  meeting_id: number;
  display_name: string;
  user_id: number | null;
  role: "host" | "participant";
  joined_at: string;
  left_at: string | null;
  is_muted: boolean;
  is_video_on: boolean;
}

export interface RecentMeeting {
  id: number;
  meeting_id: number;
  user_id: number;
  joined_at: string | null;
  list_type: "joined" | "missed";
  meeting: Meeting;
}

export interface JoinMeetingResponse {
  meeting: Meeting;
  participant: Participant;
}

export interface ScheduleMeetingPayload {
  title: string;
  description?: string;
  scheduled_start_time: string;
  duration_minutes?: number;
}

// Remote participant state managed entirely by WebSocket events
export interface RemoteParticipant {
  clientId: string;
  displayName: string;
  role: string;
  is_muted: boolean;
  is_video_on: boolean;
  is_screen_sharing: boolean;
  stream: MediaStream | null;
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  clientId: string;
  displayName: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

// ── WebSocket message types (client → server) ───────────────────────────────

export type WSMessage =
  | { event: "join-room"; displayName: string; role: string }
  | { event: "leave-room" }
  | { event: "offer"; targetClientId: string; sdp: RTCSessionDescriptionInit }
  | { event: "answer"; targetClientId: string; sdp: RTCSessionDescriptionInit }
  | {
      event: "ice-candidate";
      targetClientId: string;
      candidate: RTCIceCandidateInit;
    }
  | { event: "toggle-audio"; isMuted: boolean }
  | { event: "toggle-video"; isVideoOn: boolean }
  | { event: "screen-share-started" }
  | { event: "screen-share-stopped" }
  | { event: "mute-participant"; targetClientId: string }
  | { event: "mute-all" }
  | { event: "remove-participant"; targetClientId: string }
  | { event: "end-meeting" }
  | { event: "chat-message"; text: string };

// ── WebSocket event types (server → client) ──────────────────────────────────

export type WSEvent =
  | { event: "existing-participants"; participants: RemoteParticipant[] }
  | {
      event: "participant-joined";
      clientId: string;
      displayName: string;
      role: string;
      is_muted: boolean;
      is_video_on: boolean;
      is_screen_sharing: boolean;
    }
  | { event: "participant-left"; clientId: string }
  | { event: "participant-audio-updated"; clientId: string; isMuted: boolean }
  | { event: "participant-video-updated"; clientId: string; isVideoOn: boolean }
  | { event: "offer"; clientId: string; sdp: RTCSessionDescriptionInit }
  | { event: "answer"; clientId: string; sdp: RTCSessionDescriptionInit }
  | { event: "ice-candidate"; clientId: string; candidate: RTCIceCandidateInit }
  | { event: "screen-share-started"; clientId: string }
  | { event: "screen-share-stopped"; clientId: string }
  | { event: "host-muted-you" }
  | { event: "removed-from-meeting" }
  | { event: "meeting-ended" }
  | { event: "all-muted"; by: string }
  | {
      event: "chat-message";
      clientId: string;
      displayName: string;
      text: string;
      timestamp: string;
    };
