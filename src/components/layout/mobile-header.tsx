"use client";

import { AppLink } from "@/components/app-link";
import { CalendarClock } from "lucide-react";

export function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-top">
      <div className="flex items-center gap-2.5 px-4 h-14">
        <AppLink href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <CalendarClock className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">MeetFlow</span>
        </AppLink>
      </div>
    </header>
  );
}
