"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Bell,
  Users,
  LayoutDashboard,
  Menu,
  Plus,
  CalendarClock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMeetingStore } from "@/store/meeting-store";
import { useI18n } from "@/lib/i18n";
import { staticHref } from "@/lib/navigation";
import { getAppNavItems, isAppNavActive } from "@/lib/app-nav";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const unreadCount = useMeetingStore(
    (s) => s.notifications.filter((n) => !n.read).length
  );

  const tabItems = [
    { href: "/", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/meetings", label: t.nav.meetings, icon: Users },
    { href: "/calendar", label: t.nav.calendar, icon: Calendar },
    { href: "/notifications", label: t.nav.notifications, icon: Bell },
  ];

  const menuItems = getAppNavItems(t);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1 pb-[env(safe-area-inset-bottom,0px)]">
          {tabItems.map((item) => {
            const isActive = isAppNavActive(pathname, item.href);
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
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-lg transition-colors min-w-0 flex-1 touch-target",
              menuOpen ? "text-primary" : "text-muted-foreground"
            )}
            aria-label={t.nav.menu}
            aria-expanded={menuOpen}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium truncate max-w-full">
              {t.nav.menu}
            </span>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t.nav.closeMenu}
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.menu}
            className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col border-l bg-card shadow-xl animate-in slide-in-from-right duration-200"
          >
            <div className="flex items-center justify-between gap-2 px-4 h-14 border-b">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
                  <CalendarClock className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">MeetFlow</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {t.nav.tagline}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="touch-target flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={t.nav.closeMenu}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = isAppNavActive(pathname, item.href);
                return (
                  <a
                    key={item.href}
                    href={staticHref(item.href)}
                    onClick={() => setMenuOpen(false)}
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

            <div className="p-4 border-t safe-area-bottom">
              <a
                href={staticHref("/meetings/record")}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center justify-center gap-[calc(0.75rem-2.5mm)] px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors",
                  "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Plus className="h-4 w-4 shrink-0" />
                {t.nav.recordMeeting}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
