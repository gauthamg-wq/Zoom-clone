"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PreJoinLobby } from "@/components/meeting/PreJoinLobby";
import { MeetingEnded } from "@/components/meeting/MeetingEnded";
import { MeetingRoom } from "./MeetingRoom";
import { DEFAULT_DISPLAY_NAME } from "@/lib/constants";
import type { Meeting } from "@/lib/types";

interface MeetingPageClientProps {
  meeting: Meeting;
}

function MeetingPageClientInner({ meeting }: MeetingPageClientProps) {
  const searchParams = useSearchParams();
  const nameFromParams = searchParams.get("name") ?? DEFAULT_DISPLAY_NAME;

  const [showLobby, setShowLobby] = useState(true);
  const [confirmedName, setConfirmedName] = useState(nameFromParams);
  const [lobbyStream, setLobbyStream] = useState<MediaStream | null>(null);
  const [lobbyIsMuted, setLobbyIsMuted] = useState(false);
  const [lobbyIsVideoOn, setLobbyIsVideoOn] = useState(true);
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [myRole, setMyRole] = useState<"host" | "participant">("participant");

  if (meeting.status === "ended") {
    return <MeetingEnded meeting={meeting} />;
  }

  if (showLobby) {
    return (
      <PreJoinLobby
        meeting={meeting}
        defaultName={confirmedName}
        onJoin={(name, stream, pid, role, isMuted, isVideoOn) => {
          setConfirmedName(name);
          setLobbyStream(stream);
          setLobbyIsMuted(isMuted);
          setLobbyIsVideoOn(isVideoOn);
          setParticipantId(pid);
          setMyRole(role);
          setShowLobby(false);
        }}
      />
    );
  }

  return (
    <MeetingRoom
      meeting={meeting}
      displayName={confirmedName}
      existingStream={lobbyStream}
      participantId={participantId}
      initialRole={myRole}
      initialIsMuted={lobbyIsMuted}
      initialIsVideoOn={lobbyIsVideoOn}
    />
  );
}

export function MeetingPageClient({ meeting }: MeetingPageClientProps) {
  return (
    <Suspense>
      <MeetingPageClientInner meeting={meeting} />
    </Suspense>
  );
}
