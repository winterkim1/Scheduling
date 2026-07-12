"use client";

import { useMemo, useState } from "react";
import { AppLink } from "@/components/app-link";
import {
  addDays,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardSectionHeader } from "./section-header";
import { useI18n } from "@/lib/i18n";
import { getMeetingDetailPath } from "@/lib/meeting-routes";
import { cn } from "@/lib/utils";
import type { Meeting } from "@/types";

interface WeekScheduleProps {
  meetings: Meeting[];
  className?: string;
}

export function WeekSchedule({ meetings, className }: WeekScheduleProps) {
  const { locale, t, formatTime } = useI18n();
  const dateLocale = locale === "ko" ? ko : enUS;
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));

  const weekStart = useMemo(
    () =>
      addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7),
    [weekOffset]
  );
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const weekEvents = useMemo(
    () =>
      meetings
        .filter((m) => m.confirmedSlot)
        .map((m) => ({
          meeting: m,
          date: parseISO(m.confirmedSlot!.start),
        }))
        .filter((e) =>
          isWithinInterval(e.date, { start: weekStart, end: weekEnd })
        )
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [meetings, weekStart, weekEnd]
  );

  const weekLabel =
    locale === "ko"
      ? `${format(weekStart, "M월 d일", { locale: dateLocale })} – ${format(weekEnd, "M월 d일", { locale: dateLocale })}`
      : `${format(weekStart, "MMM d", { locale: dateLocale })} – ${format(weekEnd, "MMM d", { locale: dateLocale })}`;

  const getEventsForDay = (day: Date) =>
    weekEvents.filter((e) => isSameDay(e.date, day));

  const isSelectedDay = (day: Date) => isSameDay(day, selectedDay);

  const dayHeaderButton = (day: Date) => (
    <button
      type="button"
      onClick={() => setSelectedDay(startOfDay(day))}
      className={cn(
        "w-full text-center py-2 rounded-xl mb-2 text-sm font-medium transition-colors",
        isSelectedDay(day)
          ? "bg-[#1A1A1A] text-white"
          : "bg-muted/60 text-muted-foreground hover:bg-muted"
      )}
    >
      <p className="text-[10px]">
        {format(day, "EEE", { locale: dateLocale })}
      </p>
      <p className="text-base font-bold">{format(day, "d")}</p>
    </button>
  );

  const formatDayHeader = (day: Date) =>
    locale === "ko"
      ? format(day, "M월 d일 (EEE)", { locale: dateLocale })
      : format(day, "EEE, MMM d", { locale: dateLocale });

  return (
    <section className={cn("flex flex-col", className)}>
      <DashboardSectionHeader
        title={t.dashboard.thisWeek}
        href="/calendar"
        linkLabel={t.dashboard.viewCalendar}
      />

      <Card className="flex-1 flex flex-col">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setWeekOffset((o) => o - 1)}
              aria-label={t.dashboard.prevWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-medium text-center flex-1">{weekLabel}</p>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setWeekOffset((o) => o + 1)}
              aria-label={t.dashboard.nextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="hidden sm:grid sm:grid-cols-7 gap-2 flex-1">
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div key={day.toISOString()} className="min-h-[120px] flex flex-col">
                  {dayHeaderButton(day)}
                  <div className="space-y-1.5 flex-1">
                    {dayEvents.map(({ meeting, date }) => (
                      <AppLink key={meeting.id} href={getMeetingDetailPath(meeting.id)}>
                        <div className="rounded-md border bg-card p-2 hover:bg-accent/50 transition-colors">
                          <p className="text-xs font-medium line-clamp-2 leading-snug">
                            {meeting.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatTime(date.toISOString())}
                          </p>
                        </div>
                      </AppLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sm:hidden space-y-3 flex-1">
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((day) => (
                <div key={`pill-${day.toISOString()}`}>{dayHeaderButton(day)}</div>
              ))}
            </div>
            {(() => {
              const dayEvents = getEventsForDay(selectedDay);
              if (dayEvents.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground text-center py-4 -mt-[11mm]">
                    {t.dashboard.noThisWeek}
                  </p>
                );
              }
              return (
                <div>
                  <p className="text-xs font-semibold mb-2 text-muted-foreground">
                    {formatDayHeader(selectedDay)}
                  </p>
                  <div className="space-y-2">
                    {dayEvents.map(({ meeting, date }) => (
                      <AppLink key={meeting.id} href={getMeetingDetailPath(meeting.id)}>
                        <div className="rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                          <p className="text-sm font-medium">{meeting.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(date.toISOString())}
                          </p>
                        </div>
                      </AppLink>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {weekEvents.length === 0 && (
            <p className="hidden sm:block text-sm text-muted-foreground text-center py-6 -mt-[11mm]">
              {t.dashboard.noThisWeek}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
