import Image from "next/image";
import { Search } from "lucide-react";

export function DashboardNavbar() {
  return (
    <header className="h-14 bg-card sticky top-0 z-50 shadow-[0_1px_4px_rgba(0,0,0,0.07)] flex items-center gap-2 px-4">
      {/* Logo */}
      <div className="shrink-0">
        <Image
          src="/Zoom_logo.svg"
          width={84}
          height={19}
          alt="Zoom"
          priority
        />
      </div>

      {/* Center Search */}
      <div className="flex-1 flex justify-center px-4">
        <button className="flex items-center gap-2 h-8 px-3 rounded-md bg-muted text-sm text-muted-foreground hover:bg-muted/70 transition-colors w-full max-w-sm">
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[11px] bg-card border border-border rounded px-1.5 py-0.5 leading-4 font-sans">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3 ml-auto shrink-0">
        <button className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 active:brightness-95 transition-all">
          Upgrade to Pro
        </button>

        {/* Avatar with online presence dot */}
        <div className="relative cursor-pointer" title="Available">
          <div className="w-[30px] h-[30px] rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs select-none">
            D
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full bg-[#09a639] border-2 border-card" />
        </div>
      </div>
    </header>
  );
}
