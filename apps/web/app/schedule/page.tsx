import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ScheduleMeetingForm } from "@/components/dashboard/ScheduleMeetingForm";

export default function SchedulePage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <DashboardNavbar />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 bg-background overflow-hidden">
          <div className="w-full h-full bg-white rounded-2xl overflow-y-auto animate-fade-in">
            <ScheduleMeetingForm />
          </div>
        </main>
      </div>
    </div>
  );
}
