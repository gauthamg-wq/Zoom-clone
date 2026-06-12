import { Suspense } from "react";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { JoinMeetingFormWrapper } from "@/components/dashboard/JoinMeetingFormWrapper";

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
        <Suspense>
          <JoinMeetingFormWrapper />
        </Suspense>
      </main>
    </div>
  );
}
