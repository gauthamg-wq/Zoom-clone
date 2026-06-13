import Image from "next/image";
import { ChevronLeft, ChevronRight, History, Search } from "lucide-react";

export function DashboardNavbar() {
  return (
    <header className="h-14 bg-card sticky top-0 z-50 shadow-[0_1px_4px_rgba(0,0,0,0.07)] flex items-center gap-2 px-4">
      {/* Logo */}
      <div className="shrink-0 mr-1">
        <Image
          src="/Zoom_logo.svg"
          width={84}
          height={19}
          alt="Zoom"
          priority
        />
      </div>

      {/* Search cluster: back / forward / history / search trigger */}
      <div className="flex items-center gap-0.5 flex-1 max-w-lg">
        <button
          disabled
          aria-label="Back"
          title="Back"
          className="p-1.5 rounded text-muted-foreground/35 cursor-not-allowed select-none"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          disabled
          aria-label="Forward"
          title="Forward"
          className="p-1.5 rounded text-muted-foreground/35 cursor-not-allowed select-none"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          aria-label="History"
          title="History"
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Search trigger */}
        <button className="flex-1 flex items-center gap-2 h-8 px-3 ml-1 rounded-md bg-muted text-sm text-muted-foreground hover:bg-muted/70 transition-colors text-left">
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
