import { Settings, Bell } from "lucide-react";

export function DashboardNavbar() {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg select-none">
            Z
          </div>
          <span className="text-xl font-bold text-foreground">Zoom</span>
        </div>

        {/* Search */}
        <div className="hidden sm:flex flex-1 max-w-md">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search meetings..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              readOnly
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-md text-muted-foreground hover:bg-muted transition"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-md text-muted-foreground hover:bg-muted transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm select-none">
            D
          </div>
        </div>
      </div>
    </header>
  );
}
