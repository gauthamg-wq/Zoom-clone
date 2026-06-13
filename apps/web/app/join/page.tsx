import { Suspense } from "react";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { JoinMeetingFormWrapper } from "@/components/dashboard/JoinMeetingFormWrapper";

export default function JoinPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <DashboardNavbar />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 bg-background overflow-hidden">
          <div className="w-full h-full bg-white rounded-2xl overflow-y-auto animate-fade-in flex items-center justify-center p-6 sm:p-10">
            <Suspense>
              <JoinMeetingFormWrapper />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
