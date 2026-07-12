"use client";

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Bell,
} from "lucide-react";
import type { Translations } from "@/lib/i18n/translations";

export interface AppNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function getAppNavItems(t: Translations): AppNavItem[] {
  return [
    { href: "/", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/meetings", label: t.nav.meetings, icon: Users },
    { href: "/calendar", label: t.nav.calendar, icon: Calendar },
    { href: "/notifications", label: t.nav.notifications, icon: Bell },
    { href: "/analytics", label: t.nav.analytics, icon: BarChart3 },
    { href: "/settings", label: t.nav.settings, icon: Settings },
  ];
}

export function isAppNavActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
