"use client";

import { usePathname } from "next/navigation";
import { Calendar, Bell, User, Users, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMeetingStore } from "@/store/meeting-store";
import { useI18n } from "@/lib/i18n";
import { staticHref } from "@/lib/navigation";

export function MobileNav() {
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
    { href: "/profile", label: t.nav.profile, icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1 pb-[env(safe-area-inset-bottom,0px)]">
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
                "flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-lg transition-colors min-w-0 flex-1 touch-target",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium truncate max-w-full">
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
