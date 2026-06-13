"use client";

import { useState } from "react";
import { Check, Copy, Link2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getInviteLink } from "@/lib/invite-link";
import { formatMeetingCode } from "@/lib/meeting-code";

interface CopyInviteLinkProps {
  meeting: { invite_link: string | null; meeting_code: string };
  /** header = compact bar button; lobby = outlined row; panel = participants sidebar */
  variant?: "header" | "lobby" | "panel" | "inline";
  className?: string;
}

export function CopyInviteLink({
  meeting,
  variant = "inline",
  className,
}: CopyInviteLinkProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const link = getInviteLink(meeting);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy invite link");
    }
  }

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs sm:text-sm",
          "text-gray-300 hover:text-white hover:bg-gray-800 transition",
          className,
        )}
        title="Copy invite link"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>{copied ? "Copied!" : "Invite"}</span>
      </button>
    );
  }

  if (variant === "lobby") {
    return (
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg",
          "border border-gray-700 bg-gray-800/50 text-gray-300",
          "hover:bg-gray-800 hover:text-white transition text-sm",
          className,
        )}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Link2 className="w-4 h-4" />
        )}
        {copied ? "Link copied!" : "Copy invite link"}
      </button>
    );
  }

  if (variant === "panel") {
    return (
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md",
          "bg-primary/90 hover:bg-primary text-white text-sm font-medium transition",
          className,
        )}
      >
        {copied ? (
          <Check className="w-4 h-4" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        {copied ? "Copied!" : "Invite"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-primary hover:underline",
        className,
      )}
      title={getInviteLink(meeting)}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-600" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {copied ? "Copied!" : formatMeetingCode(meeting.meeting_code)}
    </button>
  );
}
