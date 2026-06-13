"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ZoomButton } from "@/components/ui/zoom-button";
import { CopyInviteLink } from "@/components/meeting/CopyInviteLink";
import { api } from "@/lib/api";
import { formatMeetingCode } from "@/lib/meeting-code";
import type { Meeting } from "@/lib/types";

interface PreJoinLobbyProps {
  meeting: Meeting;
  defaultName: string;
  onJoin: (
    name: string,
    stream: MediaStream | null,
    participantId: number,
    role: "host" | "participant",
    isMuted: boolean,
    isVideoOn: boolean,
  ) => void;
}

export function PreJoinLobby({
  meeting,
  defaultName,
  onJoin,
}: PreJoinLobbyProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [name, setName] = useState(defaultName);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaWarning, setMediaWarning] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // ── Cross-tab duplicate-session detection ─────────────────────────────────
  // Sends a "ping" on mount. If a MeetingRoom in another tab responds "active",
  // we surface a warning dialog before the user can join — matching Zoom's
  // "You are already in this meeting in another window" UX.
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(`meeting-${meeting.meeting_code}`);
    broadcastRef.current = channel;

    channel.onmessage = (e: MessageEvent<{ type: string }>) => {
      if (e.data?.type === "active") {
        setShowDuplicateWarning(true);
      }
    };

    // Brief delay so any MeetingRoom listeners in other tabs are ready
    const timer = setTimeout(() => {
      channel.postMessage({ type: "ping" });
    }, 120);

    return () => {
      clearTimeout(timer);
      channel.close();
      broadcastRef.current = null;
    };
  }, [meeting.meeting_code]);

  useEffect(() => {
    let cancelled = false;

    async function acquireMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setHasVideoTrack(stream.getVideoTracks().length > 0);
        setMediaReady(true);
      } catch {
        if (cancelled) return;
        // Fallback: audio only
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          setIsVideoOn(false);
          setHasVideoTrack(false);
          setMediaReady(true);
          setMediaWarning(
            "Camera unavailable — you will join with audio only.",
          );
        } catch {
          if (cancelled) return;
          setIsVideoOn(false);
          setHasVideoTrack(false);
          setMediaReady(true);
          setMediaWarning(
            "No camera or microphone access — you will join without media.",
          );
        }
      }
    }

    void acquireMedia();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // Attach stream to video element after it mounts
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
    }
  });

  function toggleMic() {
    const stream = streamRef.current;
    const newMuted = !isMuted;
    if (stream) {
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !newMuted;
      });
    }
    setIsMuted(newMuted);
  }

  function toggleCamera() {
    const stream = streamRef.current;
    if (!stream || !hasVideoTrack) return;
    const newVideoOn = !isVideoOn;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = newVideoOn;
    });
    setIsVideoOn(newVideoOn);
  }

  // Called when the user clicks "Join here" in the duplicate-session dialog.
  // Sends a takeover signal to the other tab first, then joins normally.
  function handleJoinHere() {
    broadcastRef.current?.postMessage({ type: "takeover" });
    setShowDuplicateWarning(false);
    void handleJoin();
  }

  async function handleJoin() {
    if (joining) return;
    setJoining(true);
    try {
      const joinName = name.trim() || defaultName;
      const { participant } = await api.joinMeeting(
        meeting.meeting_code,
        joinName,
      );
      // Transfer stream ownership to MeetingRoom; clear ref so cleanup doesn't stop it
      const stream = streamRef.current;
      streamRef.current = null;
      onJoin(
        joinName,
        stream,
        participant.id,
        participant.role as "host" | "participant",
        isMuted,
        isVideoOn,
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to join meeting",
      );
      setJoining(false);
    }
  }

  const displayInitial = (name.trim() || defaultName).charAt(0).toUpperCase();

  return (
    <div className="relative min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Duplicate-session warning overlay */}
      {showDuplicateWarning && (
        <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-yellow-500/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base leading-snug">
                  Already in this meeting
                </h2>
                <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                  You&apos;re already in this meeting in another browser tab.
                  Joining here will disconnect that session.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ZoomButton
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </ZoomButton>
              <ZoomButton className="flex-1" onClick={handleJoinHere}>
                Join here
              </ZoomButton>
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            {meeting.title}
          </h1>
          <p className="text-gray-500 text-sm font-mono">
            {formatMeetingCode(meeting.meeting_code)}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
          {/* Camera preview */}
          <div className="w-full lg:w-1/2 aspect-video bg-gray-900 rounded-2xl overflow-hidden relative flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "absolute inset-0 w-full h-full object-cover",
                (!isVideoOn || !hasVideoTrack) && "hidden",
              )}
            />

            {(!isVideoOn || !hasVideoTrack) && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-semibold select-none">
                  {displayInitial}
                </div>
                {!hasVideoTrack && mediaWarning && (
                  <p className="text-gray-500 text-sm text-center px-6 max-w-xs">
                    {mediaWarning}
                  </p>
                )}
              </div>
            )}

            {/* Camera / mic status overlay */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 pointer-events-none">
              {isMuted && (
                <span className="bg-red-600/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <MicOff className="w-3 h-3" /> Muted
                </span>
              )}
              {!isVideoOn && hasVideoTrack && (
                <span className="bg-gray-700/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <VideoOff className="w-3 h-3" /> Camera off
                </span>
              )}
            </div>
          </div>

          {/* Form panel */}
          <div className="w-full lg:w-1/2 space-y-5">
            {/* Media warning banner */}
            {mediaWarning && hasVideoTrack === false && mediaReady && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
                {mediaWarning}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your display name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your display name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleJoin();
                }}
              />
            </div>

            {/* Media toggles */}
            <div className="flex gap-3">
              <button
                onClick={toggleMic}
                title={isMuted ? "Unmute microphone" : "Mute microphone"}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
                  isMuted
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-white",
                )}
              >
                {isMuted ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
                {isMuted ? "Unmute" : "Mute"}
              </button>

              <button
                onClick={toggleCamera}
                disabled={!hasVideoTrack}
                title={isVideoOn ? "Stop camera" : "Start camera"}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed",
                  !isVideoOn
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-white",
                )}
              >
                {isVideoOn ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <VideoOff className="w-4 h-4" />
                )}
                {isVideoOn ? "Stop Camera" : "Start Camera"}
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <CopyInviteLink meeting={meeting} variant="lobby" />
              <ZoomButton
                className="w-full"
                onClick={() => void handleJoin()}
                disabled={joining || !mediaReady}
              >
                {joining ? "Joining…" : "Join Now"}
              </ZoomButton>
              <ZoomButton
                variant="ghost"
                className="w-full text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </ZoomButton>
            </div>

            {/* Meeting info */}
            <p className="text-xs text-gray-600 text-center">
              Others will see you as{" "}
              <span className="text-gray-400">
                {name.trim() || defaultName}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
