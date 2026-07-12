"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  max as maxDate,
  min as minDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { enUS, ko, type Locale } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export interface DateRange {
  start: Date;
  end: Date;
}

interface PastPeriodPickerProps {
  open: boolean;
  range: DateRange;
  onOpenChange: (open: boolean) => void;
  onChange: (range: DateRange) => void;
}

const DRAG_MOVE_THRESHOLD_PX = 8;

function clampToToday(date: Date) {
  const today = startOfDay(new Date());
  return isAfter(date, today) ? today : startOfDay(date);
}

export function PastPeriodPicker({
  open,
  range,
  onOpenChange,
  onChange,
}: PastPeriodPickerProps) {
  const { locale, t } = useI18n();
  const dateLocale = locale === "ko" ? ko : enUS;
  const panelRef = useRef<HTMLDivElement>(null);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(range.start));
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [draft, setDraft] = useState<DateRange>(range);

  const dragActiveRef = useRef(false);
  const dragAnchorRef = useRef<Date | null>(null);
  const suppressClickRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(range);
    setAnchor(null);
    setViewMonth(startOfMonth(range.start));
    dragActiveRef.current = false;
    dragAnchorRef.current = null;
  }, [open, range]);

  useEffect(() => {
    if (!open) return;

    const onPointerDownOutside = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    window.addEventListener("pointerdown", onPointerDownOutside);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDownOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  const today = startOfDay(new Date());
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weekdayLabels =
    locale === "ko"
      ? ["월", "화", "수", "목", "금", "토", "일"]
      : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const draftLabel = useMemo(
    () => formatPastPeriodLabel(draft, locale, dateLocale),
    [draft, locale, dateLocale]
  );

  const applyRange = (startDay: Date, endDay: Date) => {
    const start = startOfDay(minDate([startDay, endDay]));
    const end = startOfDay(maxDate([startDay, endDay]));
    setDraft({ start, end });
  };

  const getDayFromPoint = (clientX: number, clientY: number) => {
    const element = document.elementFromPoint(clientX, clientY);
    const raw = element?.closest<HTMLElement>("[data-past-day]")?.dataset.pastDay;
    if (!raw) return null;
    const day = clampToToday(new Date(raw));
    if (isAfter(day, today)) return null;
    return day;
  };

  const handleDayClick = (day: Date, shiftKey: boolean) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    const selected = clampToToday(day);
    if (isAfter(selected, today)) return;

    if (shiftKey && anchor) {
      applyRange(anchor, selected);
      return;
    }

    setAnchor(selected);
    setDraft({ start: selected, end: selected });
  };

  const handleDayPointerDown = (
    day: Date,
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (event.button !== 0) return;
    if (event.pointerType === "mouse" && event.shiftKey) return;

    const selected = clampToToday(day);
    if (isAfter(selected, today)) return;

    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    dragActiveRef.current = false;
    dragAnchorRef.current = selected;
    setAnchor(selected);
    setDraft({ start: selected, end: selected });

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleDayPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = pointerStartRef.current;
    if (!start || !dragAnchorRef.current) return;

    const moved =
      Math.abs(event.clientX - start.x) > DRAG_MOVE_THRESHOLD_PX ||
      Math.abs(event.clientY - start.y) > DRAG_MOVE_THRESHOLD_PX;

    if (!moved && !dragActiveRef.current) return;

    if (!dragActiveRef.current) {
      dragActiveRef.current = true;
      suppressClickRef.current = true;
    }

    event.preventDefault();
    const hovered = getDayFromPoint(event.clientX, event.clientY);
    if (!hovered) return;
    applyRange(dragAnchorRef.current, hovered);
  };

  const handleDayPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragActiveRef.current) {
      const hovered = getDayFromPoint(event.clientX, event.clientY);
      if (hovered && dragAnchorRef.current) {
        applyRange(dragAnchorRef.current, hovered);
      }
      suppressClickRef.current = true;
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }

    dragActiveRef.current = false;
    dragAnchorRef.current = null;
    pointerStartRef.current = null;
  };

  const handleApply = () => {
    onChange({
      start: startOfDay(draft.start),
      end: endOfDay(draft.end),
    });
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute left-1/2 top-full z-30 mt-2 w-[min(100%,320px)] -translate-x-1/2 rounded-xl border bg-card p-3 shadow-lg"
      role="dialog"
      aria-label={t.meetings.selectWeekPeriod}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-sm font-medium truncate">{draftLabel}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleClose}
          aria-label={t.meetings.closePeriodPicker}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewMonth((month) => addMonths(month, -1))}
          aria-label={t.calendar.prevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-semibold">
          {locale === "ko"
            ? format(viewMonth, "yyyy년 M월", { locale: dateLocale })
            : format(viewMonth, "MMMM yyyy", { locale: dateLocale })}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewMonth((month) => addMonths(month, 1))}
          disabled={isSameMonth(viewMonth, today) || isAfter(viewMonth, today)}
          aria-label={t.calendar.nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="text-center text-[11px] text-muted-foreground py-1"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 touch-none select-none">
        {days.map((day) => {
          const inMonth = isSameMonth(day, viewMonth);
          const disabled = isAfter(startOfDay(day), today);
          const inRange = isWithinInterval(startOfDay(day), {
            start: startOfDay(draft.start),
            end: endOfDay(draft.end),
          });
          const isStart = isSameDay(day, draft.start);
          const isEnd = isSameDay(day, draft.end);
          const isAnchor = anchor ? isSameDay(day, anchor) : false;

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled || !inMonth}
              data-past-day={day.toISOString()}
              onClick={(event) => handleDayClick(day, event.shiftKey)}
              onPointerDown={(event) => handleDayPointerDown(day, event)}
              onPointerMove={handleDayPointerMove}
              onPointerUp={handleDayPointerUp}
              onPointerCancel={handleDayPointerUp}
              className={cn(
                "h-9 rounded-md text-sm transition-colors touch-manipulation",
                !inMonth && "opacity-0 pointer-events-none",
                disabled && "opacity-40 cursor-not-allowed",
                inRange && "bg-primary/15 text-foreground",
                (isStart || isEnd) && "bg-primary text-primary-foreground",
                isAnchor && !isStart && !isEnd && "ring-1 ring-primary",
                !inRange &&
                  !disabled &&
                  inMonth &&
                  "hover:bg-accent text-foreground"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
        {t.meetings.selectWeekPeriodHint}
      </p>

      <div className="flex gap-2 mt-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleClose}
        >
          {t.meetings.closePeriodPicker}
        </Button>
        <Button type="button" className="flex-1" onClick={handleApply}>
          {t.meetings.applyPeriod}
        </Button>
      </div>
    </div>
  );
}

export function formatPastPeriodLabel(
  range: DateRange,
  locale: "ko" | "en",
  dateLocale: Locale
): string {
  const singleDay = isSameDay(range.start, range.end);
  if (locale === "ko") {
    if (singleDay) {
      return format(range.start, "M월 d일", { locale: dateLocale });
    }
    return `${format(range.start, "M월 d일", { locale: dateLocale })} – ${format(range.end, "M월 d일", { locale: dateLocale })}`;
  }
  if (singleDay) {
    return format(range.start, "MMM d", { locale: dateLocale });
  }
  return `${format(range.start, "MMM d", { locale: dateLocale })} – ${format(range.end, "MMM d", { locale: dateLocale })}`;
}

export function shiftDateRange(range: DateRange, direction: number): DateRange {
  const today = endOfDay(new Date());
  const singleDay = isSameDay(range.start, range.end);
  const stepDays = singleDay ? 1 : 7;
  let start = addDays(range.start, direction * stepDays);
  let end = addDays(range.end, direction * stepDays);

  if (isAfter(end, today)) {
    const overflow = end.getTime() - today.getTime();
    end = today;
    start = addDays(start, -Math.ceil(overflow / (24 * 60 * 60 * 1000)));
  }

  if (isBefore(end, start)) {
    start = startOfDay(end);
  }

  return {
    start: startOfDay(start),
    end: singleDay ? startOfDay(end) : endOfDay(end),
  };
}
