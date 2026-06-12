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
  joined_at: string;
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
