"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UpcomingMeetings } from "@/components/dashboard/UpcomingMeetings";
import { RecentMeetings } from "@/components/dashboard/RecentMeetings";
import { ZoomButton } from "@/components/ui/zoom-button";
import { ZoomSkeleton } from "@/components/ui/zoom-skeleton";
import { api } from "@/lib/api";
import type { Meeting, RecentMeeting } from "@/lib/types";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ZoomSkeleton className="h-40" />
        <ZoomSkeleton className="h-40" />
        <ZoomSkeleton className="h-40" />
      </div>
      <ZoomSkeleton className="h-6 w-48" />
      <div className="space-y-2">
        <ZoomSkeleton className="h-14" />
        <ZoomSkeleton className="h-14" />
      </div>
      <ZoomSkeleton className="h-6 w-48" />
      <div className="space-y-2">
        <ZoomSkeleton className="h-14" />
        <ZoomSkeleton className="h-14" />
      </div>
    </div>
  );
}

function MeetingBanner() {
  const params = useSearchParams();
  const removed = params.get("removed") === "1";
  const ended = params.get("ended") === "1";
  if (!removed && !ended) return null;
  return (
    <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700">
      {removed
        ? "You were removed from the meeting by the host."
        : "The meeting has ended."}
    </div>
  );
}

export default function DashboardPage() {
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<RecentMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getUpcomingMeetings(), api.getRecentMeetings()])
      .then(([up, rec]) => {
        if (cancelled) return;
        setUpcoming(up);
        setRecent(rec);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load meetings",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <Suspense>
          <MeetingBanner />
        </Suspense>
        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-4 space-y-3">
            <p className="text-sm text-destructive">
              Could not load meetings. Check your connection.
            </p>
            <ZoomButton
              size="sm"
              variant="outline"
              onClick={() => {
                setLoading(true);
                setError(null);
                setRetryKey((k) => k + 1);
              }}
            >
              Retry
            </ZoomButton>
          </div>
        ) : (
          <>
            <QuickActions />
            <UpcomingMeetings meetings={upcoming} />
            <RecentMeetings meetings={recent} />
          </>
        )}
      </main>
    </div>
  );
}
