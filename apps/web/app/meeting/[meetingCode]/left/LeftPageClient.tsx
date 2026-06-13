"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Video } from "lucide-react";
import { ZoomButton } from "@/components/ui/zoom-button";
import type { Meeting } from "@/lib/types";

interface LeftPageClientProps {
  meeting: Meeting | null;
  meetingCode: string;
}

export function LeftPageClient({ meeting, meetingCode }: LeftPageClientProps) {
  const [copied, setCopied] = useState(false);

  const isLive = meeting?.status === "live";
  const isEnded = meeting?.status === "ended";

  function handleCopy() {
    const link = `${window.location.origin}/meeting/${meetingCode}`;
    void navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
          <Video className="w-8 h-8 text-gray-400" />
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            You left the meeting
          </h1>
          {meeting && <p className="text-gray-400 text-sm">{meeting.title}</p>}
        </div>

        {/* Invite link */}
        <div className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="flex-1 text-sm text-gray-400 font-mono truncate text-left">
            {meetingCode}
          </span>
          <button
            onClick={handleCopy}
            className="shrink-0 text-gray-400 hover:text-white transition"
            title="Copy invite link"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isEnded ? (
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm text-gray-400">
              This meeting has ended and cannot be rejoined.
            </div>
          ) : (
            <Link href={`/meeting/${meetingCode}`}>
              <ZoomButton className="w-full">
                {isLive ? "Rejoin Meeting" : "Return to Meeting"}
              </ZoomButton>
            </Link>
          )}
          <Link href="/dashboard">
            <ZoomButton variant="outline" className="w-full">
              Back to Dashboard
            </ZoomButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
