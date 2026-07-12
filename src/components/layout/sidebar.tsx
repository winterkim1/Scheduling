"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Plus,
  CalendarClock,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { staticHref } from "@/lib/navigation";
import { useMeetingStore } from "@/store/meeting-store";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const unreadCount = useMeetingStore(
    (s) => s.notifications.filter((n) => !n.read).length
  );

  const navItems = [
    { href: "/", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/meetings", label: t.nav.meetings, icon: Users },
    { href: "/calendar", label: t.nav.calendar, icon: Calendar },
    { href: "/notifications", label: t.nav.notifications, icon: Bell },
    { href: "/analytics", label: t.nav.analytics, icon: BarChart3 },
    { href: "/settings", label: t.nav.settings, icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-6 h-16 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <CalendarClock className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-sm">MeetFlow</h1>
          <p className="text-[10px] text-muted-foreground">{t.nav.tagline}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={staticHref(item.href)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="h-4 w-4" />
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <a
          href={staticHref("/meetings/record")}
          className={cn(
            "flex items-center justify-center gap-[calc(0.75rem-2.5mm)] px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors",
            "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {t.nav.recordMeeting}
        </a>
      </div>
    </aside>
  );
}
