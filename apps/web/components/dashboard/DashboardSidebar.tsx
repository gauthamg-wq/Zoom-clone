"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Video,
  MessageSquare,
  MoreHorizontal,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "home", label: "Home", icon: Home, href: "/dashboard" },
  { id: "meetings", label: "Meetings", icon: Video, href: null },
  { id: "chat", label: "Chat", icon: MessageSquare, href: null },
  { id: "more", label: "More", icon: MoreHorizontal, href: null },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden sm:flex w-[68px] shrink-0 flex-col items-center pt-1 pb-2 bg-card">
      {/* Nav tabs */}
      <nav className="flex-1 flex flex-col items-center gap-0.5 w-full px-1.5 pt-1">
        {navItems.map(({ id, label, icon: Icon, href }) => {
          const isActive = href !== null && pathname === href;
          const itemClass = cn(
            "flex flex-col items-center justify-center gap-[5px] w-full py-2.5 rounded-lg transition-colors",
            isActive
              ? "text-primary bg-primary/10"
              : href !== null
                ? "text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                : "text-muted-foreground/50 cursor-default",
          );

          if (href !== null) {
            return (
              <Link key={id} href={href} className="w-full">
                <div className={itemClass}>
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="text-[10px] font-medium leading-none">
                    {label}
                  </span>
                </div>
              </Link>
            );
          }

          return (
            <button key={id} disabled className="w-full">
              <div className={itemClass}>
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-[10px] font-medium leading-none">
                  {label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="px-1.5 w-full pb-1">
        <button className="flex flex-col items-center justify-center gap-[5px] w-full py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Settings className="w-[18px] h-[18px]" />
          <span className="text-[10px] font-medium leading-none">Settings</span>
        </button>
      </div>
    </aside>
  );
}
