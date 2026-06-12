"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MeetingHeader } from "@/components/meeting/MeetingHeader";
import { VideoGrid } from "@/components/meeting/VideoGrid";
import { ControlBar } from "@/components/meeting/ControlBar";
import { ParticipantsSidebar } from "@/components/meeting/ParticipantsSidebar";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { api } from "@/lib/api";
import { DEFAULT_DISPLAY_NAME } from "@/lib/constants";
import type { Meeting } from "@/lib/types";

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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

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

  // On mount: join if no participantId in URL, then start media
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
          // best-effort; proceed with media regardless
        }
      }
      await startMedia();
    }
    void init();

    return () => {
      stopMedia();
    };
    // startMedia / stopMedia are stable callbacks — this runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLeave = useCallback(async () => {
    if (isLeaving) return;
    setIsLeaving(true);
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
  }, [isLeaving, meeting.meeting_code, router, stopMedia]);

  const handleEnd = useCallback(async () => {
    if (isLeaving) return;
    setIsLeaving(true);
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
  }, [isLeaving, meeting.meeting_code, router, stopMedia]);

  return (
    <div className="meeting-root">
      <MeetingHeader
        meetingCode={meeting.meeting_code}
        isHost={isHost}
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
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleSidebar={() => setIsSidebarOpen((o) => !o)}
        onLeave={handleLeave}
        onEnd={handleEnd}
      />
    </div>
  );
}
