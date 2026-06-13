"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PreJoinLobby } from "@/components/meeting/PreJoinLobby";
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
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [myRole, setMyRole] = useState<"host" | "participant">("participant");

  if (showLobby) {
    return (
      <PreJoinLobby
        meeting={meeting}
        defaultName={confirmedName}
        onJoin={(name, stream, pid, role) => {
          setConfirmedName(name);
          setLobbyStream(stream);
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
