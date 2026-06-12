"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MeetingHeader } from "@/components/meeting/MeetingHeader";
import { VideoGrid } from "@/components/meeting/VideoGrid";
import { ControlBar } from "@/components/meeting/ControlBar";
import { ParticipantsSidebar } from "@/components/meeting/ParticipantsSidebar";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useWebSocket } from "@/hooks/useWebSocket";
import { api } from "@/lib/api";
import { DEFAULT_DISPLAY_NAME } from "@/lib/constants";
import type { Meeting, RemoteParticipant, WSEvent } from "@/lib/types";

interface MeetingRoomProps {
  meeting: Meeting;
}

function PermissionError({ message }: { message: string }) {
  return (
    <div className="flex-1 meeting-bg flex items-center justify-center">
      <div className="text-center space-y-3 max-w-sm px-4">
        <div className="text-4xl">🎥</div>
        <p className="text-white font-semibold">Camera access required</p>
        <p className="text-gray-400 text-sm">{message}</p>
      </div>
    </div>
  );
}

export function MeetingRoom({ meeting }: MeetingRoomProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const displayName = searchParams.get("name") ?? DEFAULT_DISPLAY_NAME;
  const participantIdParam = searchParams.get("participantId");

  const participantIdRef = useRef<number | null>(
    participantIdParam ? parseInt(participantIdParam, 10) : null,
  );

  // Stable UUID for this browser session in this meeting
  const clientId = useMemo(() => crypto.randomUUID(), []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState<
    RemoteParticipant[]
  >([]);

  const {
    localStream,
    isMuted,
    isVideoOn,
    error,
    toggleAudio,
    toggleVideo,
    startMedia,
    stopMedia,
  } = useMediaDevices();

  const isHost = meeting.host_user_id === 1;

  // ── WebSocket event handler ────────────────────────────────────────────────
  const handleWsEvent = useCallback(
    (ev: WSEvent) => {
      switch (ev.event) {
        case "existing-participants":
          setRemoteParticipants(
            ev.participants.map((p) => ({ ...p, stream: null })),
          );
          break;

        case "participant-joined":
          setRemoteParticipants((prev) => [
            ...prev,
            {
              clientId: ev.clientId,
              displayName: ev.displayName,
              role: ev.role,
              is_muted: false,
              is_video_on: true,
              is_screen_sharing: false,
              stream: null,
            },
          ]);
          break;

        case "participant-left":
          setRemoteParticipants((prev) =>
            prev.filter((p) => p.clientId !== ev.clientId),
          );
          break;

        case "participant-audio-updated":
          setRemoteParticipants((prev) =>
            prev.map((p) =>
              p.clientId === ev.clientId ? { ...p, is_muted: ev.isMuted } : p,
            ),
          );
          break;

        case "participant-video-updated":
          setRemoteParticipants((prev) =>
            prev.map((p) =>
              p.clientId === ev.clientId
                ? { ...p, is_video_on: ev.isVideoOn }
                : p,
            ),
          );
          break;

        case "meeting-ended":
          stopMedia();
          router.push("/dashboard");
          break;

        case "removed-from-meeting":
          stopMedia();
          router.push("/dashboard");
          break;

        case "host-muted-you":
          // Mute local track so other participants also hear silence
          if (!isMuted) toggleAudio();
          break;

        // offer / answer / ice-candidate forwarded to useWebRTC in Phase 6
        default:
          break;
      }
    },
    // toggleAudio and isMuted are stable / primitive — safe to list
    [isMuted, router, stopMedia, toggleAudio],
  );

  const { send, isConnected } = useWebSocket({
    meetingCode: meeting.meeting_code,
    clientId,
    onEvent: handleWsEvent,
  });

  // ── On WS connect: announce presence ──────────────────────────────────────
  useEffect(() => {
    if (isConnected) {
      send({
        event: "join-room",
        displayName,
        role: isHost ? "host" : "participant",
      });
    }
    // Only fire when the connection first opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // ── On mount: ensure DB participant record + start camera/mic ─────────────
  useEffect(() => {
    async function init() {
      if (!participantIdRef.current) {
        try {
          const { participant } = await api.joinMeeting(
            meeting.meeting_code,
            displayName,
          );
          participantIdRef.current = participant.id;
        } catch {
          // best-effort
        }
      }
      await startMedia();
    }
    void init();

    return () => {
      stopMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Wrapped toggles that also signal over WS ──────────────────────────────
  const handleToggleAudio = useCallback(() => {
    toggleAudio();
    send({ event: "toggle-audio", isMuted: !isMuted });
  }, [isMuted, send, toggleAudio]);

  const handleToggleVideo = useCallback(() => {
    toggleVideo();
    send({ event: "toggle-video", isVideoOn: !isVideoOn });
  }, [isVideoOn, send, toggleVideo]);

  // ── Leave / End ────────────────────────────────────────────────────────────
  const handleLeave = useCallback(async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    send({ event: "leave-room" });
    const pid = participantIdRef.current;
    if (pid) {
      try {
        await api.leaveParticipant(meeting.meeting_code, pid);
      } catch {
        // best-effort
      }
    }
    stopMedia();
    router.push("/dashboard");
  }, [isLeaving, meeting.meeting_code, router, send, stopMedia]);

  const handleEnd = useCallback(async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    send({ event: "end-meeting" });
    try {
      await api.endMeeting(meeting.meeting_code);
    } catch {
      // best-effort
    }
    const pid = participantIdRef.current;
    if (pid) {
      try {
        await api.leaveParticipant(meeting.meeting_code, pid);
      } catch {
        // best-effort
      }
    }
    stopMedia();
    router.push("/dashboard");
  }, [isLeaving, meeting.meeting_code, router, send, stopMedia]);

  return (
    <div className="meeting-root">
      <MeetingHeader
        meetingCode={meeting.meeting_code}
        isHost={isHost}
        isConnected={isConnected}
        onLeave={handleLeave}
        onEnd={handleEnd}
      />

      <div className="flex flex-1 overflow-hidden">
        {error ? (
          <PermissionError message={error} />
        ) : (
          <VideoGrid
            localStream={localStream}
            localName={displayName}
            isMuted={isMuted}
            isVideoOn={isVideoOn}
            remoteParticipants={remoteParticipants}
          />
        )}

        {isSidebarOpen && (
          <ParticipantsSidebar
            meetingCode={meeting.meeting_code}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      <ControlBar
        isMuted={isMuted}
        isVideoOn={isVideoOn}
        isHost={isHost}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleSidebar={() => setIsSidebarOpen((o) => !o)}
        onLeave={handleLeave}
        onEnd={handleEnd}
      />
    </div>
  );
}
