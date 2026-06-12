import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { ScheduleMeetingForm } from "@/components/dashboard/ScheduleMeetingForm";

export default function SchedulePage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
        <ScheduleMeetingForm />
      </main>
    </div>
  );
}
