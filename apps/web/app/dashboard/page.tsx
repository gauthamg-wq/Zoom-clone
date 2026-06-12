"use client";

import { useEffect, useState } from "react";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UpcomingMeetings } from "@/components/dashboard/UpcomingMeetings";
import { RecentMeetings } from "@/components/dashboard/RecentMeetings";
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

export default function DashboardPage() {
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<RecentMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getUpcomingMeetings(), api.getRecentMeetings()])
      .then(([up, rec]) => {
        setUpcoming(up);
        setRecent(rec);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Failed to load meetings",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
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
