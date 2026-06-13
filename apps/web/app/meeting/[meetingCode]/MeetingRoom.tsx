"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MeetingHeader } from "@/components/meeting/MeetingHeader";
import { VideoGrid } from "@/components/meeting/VideoGrid";
import { ControlBar } from "@/components/meeting/ControlBar";
import { ChatSidebar } from "@/components/meeting/ChatSidebar";
import { ParticipantsSidebar } from "@/components/meeting/ParticipantsSidebar";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useWebRTC } from "@/hooks/useWebRTC";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { DEFAULT_DISPLAY_NAME } from "@/lib/constants";
import type {
  ChatMessage,
  Meeting,
  RemoteParticipant,
  WSEvent,
} from "@/lib/types";

interface MeetingRoomProps {
  meeting: Meeting;
  /** Display name determined by the pre-join lobby. Falls back to DEFAULT_DISPLAY_NAME. */
  displayName?: string;
  /** Stream acquired in the pre-join lobby. When provided, getUserMedia is not called again. */
  existingStream?: MediaStream | null;
  /** DB participant ID already created in the lobby. When provided, api.joinMeeting is not called. */
  participantId?: number | null;
  /** Role determined by the lobby API response. */
  initialRole?: "host" | "participant";
  /** Mute state chosen in the lobby — forwarded to startMedia() in case Strict Mode kills the stream. */
  initialIsMuted?: boolean;
  /** Video state chosen in the lobby — forwarded to startMedia() in case Strict Mode kills the stream. */
  initialIsVideoOn?: boolean;
}

function MediaErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const isFatal = message.includes("try again");
  return (
    <div className="flex items-center gap-3 bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2 text-sm text-yellow-400 shrink-0">
      <span className="flex-1">{message}</span>
      {isFatal && (
        <button
          onClick={onRetry}
          className="shrink-0 text-xs underline hover:text-yellow-300 transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function MeetingRoom({
  meeting,
  displayName: displayNameProp,
  existingStream,
  participantId: participantIdProp,
  initialRole,
  initialIsMuted,
  initialIsVideoOn,
}: MeetingRoomProps) {
  const router = useRouter();

  const displayName = displayNameProp ?? DEFAULT_DISPLAY_NAME;

  const participantIdRef = useRef<number | null>(participantIdProp ?? null);

  const clientId = useMemo(() => crypto.randomUUID(), []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [myRole, setMyRole] = useState<"host" | "participant">(
    initialRole ?? "participant",
  );
  const [remoteParticipants, setRemoteParticipants] = useState<
    RemoteParticipant[]
  >([]);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map(),
  );

  const {
    localStream,
    isMuted,
    isVideoOn,
    error,
    toggleAudio,
    toggleVideo,
    startMedia,
    stopMedia,
    initWithStream,
  } = useMediaDevices();

  const isHost = myRole === "host";

  // ── WebSocket ──────────────────────────────────────────────────────────────
  // handleWsEvent is defined after useWebRTC to close over its handlers,
  // but useWebSocket needs a stable callback reference. Use a ref bridge.
  const wsEventHandlerRef = useRef<(event: WSEvent) => void>(() => undefined);

  const { send, isConnected } = useWebSocket({
    meetingCode: meeting.meeting_code,
    clientId,
    onEvent: useCallback(
      (event: WSEvent) => wsEventHandlerRef.current(event),
      [],
    ),
  });

  // ── WebRTC ─────────────────────────────────────────────────────────────────
  const {
    handleSignal,
    handleExistingParticipants,
    handleParticipantLeft,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    localPreviewStream,
    replaceVideoTrack,
  } = useWebRTC({
    localStream,
    onRemoteStream: (id, stream) => {
      setRemoteStreams((prev) => new Map(prev).set(id, stream));
    },
    onRemoteStreamRemoved: (id) => {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    },
    send,
  });

  // ── WS event handler (wired after both hooks are ready) ────────────────────
  const handleWsEvent = useCallback(
    (ev: WSEvent) => {
      switch (ev.event) {
        case "existing-participants":
          setRemoteParticipants(
            ev.participants.map((p) => ({ ...p, stream: null })),
          );
          handleExistingParticipants(ev.participants.map((p) => p.clientId));
          break;

        case "participant-joined":
          // Upsert — if this clientId is already present (e.g. Strict Mode causes a
          // double join-room) update in place instead of appending a duplicate tile.
          setRemoteParticipants((prev) => {
            const exists = prev.some((p) => p.clientId === ev.clientId);
            if (exists) {
              return prev.map((p) =>
                p.clientId === ev.clientId
                  ? {
                      ...p,
                      displayName: ev.displayName,
                      role: ev.role,
                      is_muted: ev.is_muted,
                      is_video_on: ev.is_video_on,
                      is_screen_sharing: ev.is_screen_sharing,
                    }
                  : p,
              );
            }
            return [
              ...prev,
              {
                clientId: ev.clientId,
                displayName: ev.displayName,
                role: ev.role,
                is_muted: ev.is_muted,
                is_video_on: ev.is_video_on,
                is_screen_sharing: ev.is_screen_sharing,
                stream: null,
              },
            ];
          });
          break;

        case "participant-left":
          setRemoteParticipants((prev) =>
            prev.filter((p) => p.clientId !== ev.clientId),
          );
          handleParticipantLeft(ev.clientId);
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

        case "screen-share-started":
          setRemoteParticipants((prev) =>
            prev.map((p) =>
              p.clientId === ev.clientId
                ? { ...p, is_screen_sharing: true }
                : p,
            ),
          );
          break;

        case "screen-share-stopped":
          setRemoteParticipants((prev) =>
            prev.map((p) =>
              p.clientId === ev.clientId
                ? { ...p, is_screen_sharing: false }
                : p,
            ),
          );
          break;

        // Route WebRTC signals into the hook
        case "offer":
        case "answer":
        case "ice-candidate":
          void handleSignal(ev);
          break;

        case "meeting-ended":
          toast.info("The meeting has ended.");
          stopMedia();
          router.push("/dashboard?ended=1");
          break;

        case "removed-from-meeting":
          toast.warning("You were removed from the meeting.");
          stopMedia();
          router.push("/dashboard?removed=1");
          break;

        case "all-muted":
        case "host-muted-you":
          if (!isMuted) {
            toggleAudio();
            toast.info("You have been muted by the host.");
          }
          break;

        case "chat-message":
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              clientId: ev.clientId,
              displayName: ev.displayName,
              text: ev.text,
              timestamp: ev.timestamp,
              isOwn: ev.clientId === clientId,
            },
          ]);
          setIsChatOpen((open) => {
            if (!open) setUnreadCount((n) => n + 1);
            return open;
          });
          break;

        default:
          break;
      }
    },
    [
      clientId,
      handleExistingParticipants,
      handleParticipantLeft,
      handleSignal,
      isMuted,
      router,
      stopMedia,
      toggleAudio,
    ],
  );

  // Keep the ref current so the stable useWebSocket callback always calls the latest handler
  useEffect(() => {
    wsEventHandlerRef.current = handleWsEvent;
  });

  // ── Cross-tab duplicate-session handling (BroadcastChannel) ──────────────
  // When a second browser tab opens the same meeting:
  //   1. The lobby tab sends "ping" → this room responds "active"
  //   2. If the user chooses "Join here" in the lobby, it sends "takeover"
  //      → this room gracefully leaves and redirects to the dashboard
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(`meeting-${meeting.meeting_code}`);

    channel.onmessage = (e: MessageEvent<{ type: string }>) => {
      if (e.data?.type === "ping") {
        channel.postMessage({ type: "active" });
      } else if (e.data?.type === "takeover") {
        toast.info("You joined this meeting in another window.");
        send({ event: "leave-room" });
        const pid = participantIdRef.current;
        if (pid) {
          void api.leaveParticipant(meeting.meeting_code, pid).catch(() => {});
        }
        stopMedia();
        router.push("/dashboard");
      }
    };

    return () => channel.close();
  }, [meeting.meeting_code, router, send, stopMedia]);

  // ── Announce presence when WS connects ────────────────────────────────────
  // Include the current media state so the backend initialises the participant's
  // ParticipantState correctly.  Without this the first participant-joined
  // broadcast always advertises is_muted=false even when the user joined muted
  // from the lobby, causing remotes to show the wrong badge until the separate
  // toggle-audio sync fires.
  useEffect(() => {
    if (isConnected) {
      send({
        event: "join-room",
        displayName,
        role: isHost ? "host" : "participant",
        isMuted,
        isVideoOn,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // ── Mount: ensure DB participant + acquire / adopt media ──────────────────
  useEffect(() => {
    async function init() {
      // If the lobby already registered the participant, skip the API call.
      if (!participantIdRef.current) {
        try {
          const { participant } = await api.joinMeeting(
            meeting.meeting_code,
            displayName,
          );
          participantIdRef.current = participant.id;
          setMyRole(participant.role as "host" | "participant");
        } catch {
          // best-effort
        }
      }

      // Use the lobby stream only if its tracks are still live.
      // React Strict Mode runs the effect cleanup once before re-mounting,
      // which calls stopMedia() and ends all tracks on existingStream. On the
      // second mount we detect the dead tracks and call startMedia() instead
      // so the user always gets a working stream in development.
      const streamIsLive =
        existingStream !== null &&
        existingStream !== undefined &&
        existingStream.getTracks().some((t) => t.readyState === "live");

      if (streamIsLive) {
        initWithStream(existingStream!);
      } else {
        // Pass the lobby preferences so startMedia() can restore the user's
        // chosen mute/video state even though it is creating a fresh stream
        // (lobby stream died in the Strict Mode cleanup).
        await startMedia({
          isMuted: initialIsMuted,
          isVideoOn: initialIsVideoOn,
        });
      }
    }
    void init();
    return () => {
      stopMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync initial media state with the server ──────────────────────────────
  // The backend initialises every ParticipantState with is_video_on=True and
  // is_muted=False.  If the user joined with video/audio already off (lobby
  // state), or if React Strict Mode's double-mount causes a re-join that resets
  // those defaults, we push the real values each time the stream or connection
  // becomes ready.
  //
  // Sending on every isMuted/isVideoOn change is intentional: it acts as both
  // an initial sync AND a redundancy layer for normal toggles.  The backend
  // update is idempotent (same value → same broadcast → no visible UI change
  // for remote peers), so the extra event is harmless.
  useEffect(() => {
    if (!localStream || !isConnected) return;
    send({ event: "toggle-audio", isMuted });
    send({ event: "toggle-video", isVideoOn });
  }, [isConnected, isMuted, isVideoOn, localStream, send]);

  // ── Toggle wrappers that also signal over WS ──────────────────────────────
  const handleToggleAudio = useCallback(() => {
    toggleAudio();
    send({ event: "toggle-audio", isMuted: !isMuted });
  }, [isMuted, send, toggleAudio]);

  const handleToggleVideo = useCallback(() => {
    // toggleVideo() is async: it stops the camera track (LED off) or acquires a
    // new one. The result must then be synced to every RTCRtpSender so remote
    // peers see the correct video state without full SDP renegotiation.
    void (async () => {
      const newTrack = await toggleVideo();
      await replaceVideoTrack(newTrack);
      // While screen sharing the remote video track is the screen, not the
      // camera.  Sending toggle-video would wrongly hide the screen on remote tiles.
      if (!isScreenSharing) {
        // isVideoOn is the PREVIOUS state captured in the closure.
        // If was ON and we turned off → newTrack is null → new state = false.
        // If was OFF and we turned on  → newTrack is non-null → new state = true.
        const newVideoOn = isVideoOn ? false : newTrack !== null;
        send({ event: "toggle-video", isVideoOn: newVideoOn });
      }
    })();
  }, [isVideoOn, isScreenSharing, send, toggleVideo, replaceVideoTrack]);

  // When screen sharing stops, re-broadcast the actual camera state so remote
  // tiles correctly reflect whether the camera is on or off.
  const handleStopScreenShare = useCallback(() => {
    stopScreenShare();
    send({ event: "toggle-video", isVideoOn: isVideoOn });
  }, [isVideoOn, send, stopScreenShare]);

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
        /* best-effort */
      }
    }
    stopMedia();
    router.push(`/meeting/${meeting.meeting_code}/left`);
  }, [isLeaving, meeting.meeting_code, router, send, stopMedia]);

  const handleEnd = useCallback(async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    send({ event: "end-meeting" });
    try {
      await api.endMeeting(meeting.meeting_code);
    } catch {
      /* best-effort */
    }
    const pid = participantIdRef.current;
    if (pid) {
      try {
        await api.leaveParticipant(meeting.meeting_code, pid);
      } catch {
        /* best-effort */
      }
    }
    stopMedia();
    router.push("/dashboard");
  }, [isLeaving, meeting.meeting_code, router, send, stopMedia]);

  return (
    <div className="meeting-root">
      <MeetingHeader
        title={meeting.title}
        meetingCode={meeting.meeting_code}
        inviteLink={meeting.invite_link}
        isConnected={isConnected}
      />

      {error && (
        <MediaErrorBanner message={error} onRetry={() => void startMedia()} />
      )}

      <div className="flex flex-1 overflow-hidden">
        <VideoGrid
          localStream={localPreviewStream ?? localStream}
          localName={displayName}
          isMuted={isMuted}
          isVideoOn={isVideoOn}
          isHost={isHost}
          isScreenSharing={isScreenSharing}
          remoteParticipants={remoteParticipants}
          remoteStreams={remoteStreams}
        />

        {isSidebarOpen && (
          <ParticipantsSidebar
            meeting={meeting}
            localName={displayName}
            isHost={isHost}
            remoteParticipants={remoteParticipants}
            send={send}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        {isChatOpen && (
          <ChatSidebar
            messages={messages}
            onSend={(text) => send({ event: "chat-message", text })}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </div>

      <ControlBar
        isMuted={isMuted}
        isVideoOn={isVideoOn}
        isHost={isHost}
        isScreenSharing={isScreenSharing}
        unreadCount={unreadCount}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={
          isScreenSharing ? handleStopScreenShare : startScreenShare
        }
        onToggleSidebar={() => setIsSidebarOpen((o) => !o)}
        onToggleChat={() => {
          setIsChatOpen((o) => !o);
          setUnreadCount(0);
        }}
        onMuteAll={isHost ? () => send({ event: "mute-all" }) : undefined}
        onLeave={handleLeave}
        onEnd={handleEnd}
      />
    </div>
  );
}
