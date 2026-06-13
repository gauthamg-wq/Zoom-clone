"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Plus, Calendar } from "lucide-react";
import { ZoomButton } from "@/components/ui/zoom-button";
import { ZoomCard, ZoomCardContent } from "@/components/ui/zoom-card";
import { api } from "@/lib/api";

export function QuickActions() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  async function handleNewMeeting() {
    setStarting(true);
    try {
      const meeting = await api.createInstantMeeting();
      router.push(`/meeting/${meeting.meeting_code}`);
    } catch {
      setStarting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <ZoomCard className="cursor-pointer">
        <ZoomCardContent className="pt-6 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Video className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">New Meeting</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Start an instant meeting
            </p>
          </div>
          <ZoomButton
            className="w-full"
            onClick={handleNewMeeting}
            disabled={starting}
          >
            {starting ? "Starting…" : "Start"}
          </ZoomButton>
        </ZoomCardContent>
      </ZoomCard>

      <ZoomCard className="cursor-pointer">
        <ZoomCardContent className="pt-6 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <Plus className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Join</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter a meeting code
            </p>
          </div>
          <ZoomButton
            variant="secondary"
            className="w-full"
            onClick={() => router.push("/join")}
          >
            Join
          </ZoomButton>
        </ZoomCardContent>
      </ZoomCard>

      <ZoomCard className="cursor-pointer">
        <ZoomCardContent className="pt-6 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
            <Calendar className="w-7 h-7 text-orange-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Schedule</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Plan a future meeting
            </p>
          </div>
          <ZoomButton
            variant="outline"
            className="w-full"
            onClick={() => router.push("/schedule")}
          >
            Schedule
          </ZoomButton>
        </ZoomCardContent>
      </ZoomCard>
    </div>
  );
}
