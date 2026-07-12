"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppLink } from "@/components/app-link";
import { motion } from "framer-motion";
import {
  addDays,
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/meetings/status-badge";
import { useShallow } from "zustand/react/shallow";
import { useMeetingStore } from "@/store/meeting-store";
import { useI18n } from "@/lib/i18n";
import { getMeetingDetailPath } from "@/lib/meeting-routes";
import { cn } from "@/lib/utils";
import { getUserCalendarEvents } from "@/lib/calendar-events";
import type { CalendarEvent, Meeting } from "@/types";
import { CalendarDayActionShell } from "@/components/calendar/calendar-day-action-shell";
import {
  CalendarEventFormModal,
  eventToFormValues,
  type CalendarEventFormValues,
} from "@/components/calendar/calendar-event-form-modal";

type CalendarView = "year" | "month" | "week";
type CalendarCategory = "meetings" | "all" | "team" | "personal";

type CalendarDisplayEvent = {
  id: string;
  title: string;
  date: Date;
  startIso: string;
  kind: "meeting" | "personal" | "team";
  meeting?: Meeting;
};

const confirmedEventStyles = {
  compact:
    "rounded border border-green-300 bg-green-100 p-1.5 transition-colors hover:bg-green-200/80 dark:border-green-700 dark:bg-green-900/30",
  compactTitle: "text-[10px] font-medium truncate text-black/95",
  compactTime: "text-[9px] text-green-700/80 dark:text-green-400/80",
  card:
    "border-green-200 bg-green-50/50 transition-shadow hover:bg-green-100/60 hover:shadow-md dark:border-green-800 dark:bg-green-900/10 dark:hover:bg-green-900/20",
  cardTitle: "font-medium text-black/95",
  cardTime: "text-sm text-green-700/80 dark:text-green-400/80",
  cardTimeSm: "text-[10px] text-green-700/80 dark:text-green-400/80",
};

const otherEventStyles = {
  personal: {
    compact:
      "rounded border border-sky-300 bg-sky-100 p-1.5 dark:border-sky-700 dark:bg-sky-900/30",
    compactTitle: "text-[10px] font-medium truncate text-black/95",
    compactTime: "text-[9px] text-sky-700/80 dark:text-sky-400/80",
    card:
      "border-sky-200 bg-sky-50/50 dark:border-sky-800 dark:bg-sky-900/10",
    cardTitle: "font-medium text-black/95",
    cardTime: "text-sm text-sky-700/80 dark:text-sky-400/80",
    cardTimeSm: "text-[10px] text-sky-700/80 dark:text-sky-400/80",
  },
  team: {
    compact:
      "rounded border border-amber-300 bg-amber-100 p-1.5 dark:border-amber-700 dark:bg-amber-900/30",
    compactTitle: "text-[10px] font-medium truncate text-black/95",
    compactTime: "text-[9px] text-amber-700/80 dark:text-amber-400/80",
    card:
      "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10",
    cardTitle: "font-medium text-black/95",
    cardTime: "text-sm text-amber-700/80 dark:text-amber-400/80",
    cardTimeSm: "text-[10px] text-amber-700/80 dark:text-amber-400/80",
  },
} as const;

function eventStylesFor(kind: CalendarDisplayEvent["kind"]) {
  if (kind === "meeting") return confirmedEventStyles;
  return otherEventStyles[kind];
}

function toEventIso(date: string, time: string) {
  return parseISO(`${date}T${time}:00`).toISOString();
}

export default function CalendarPage() {
  const pathname = usePathname();
  const meetings = useMeetingStore(useShallow((s) => s.getOrganizerMeetings()));
  const viewingAsUserId = useMeetingStore((s) => s.viewingAsUserId);
  const calendarEvents = useMeetingStore((s) => s.calendarEvents);
  const addCalendarEvent = useMeetingStore((s) => s.addCalendarEvent);
  const updateCalendarEvent = useMeetingStore((s) => s.updateCalendarEvent);
  const deleteCalendarEvent = useMeetingStore((s) => s.deleteCalendarEvent);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [category, setCategory] = useState<CalendarCategory>("meetings");
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() =>
    new Date().getMonth()
  );
  const [actionDay, setActionDay] = useState<Date | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formDate, setFormDate] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"edit" | "delete">("edit");
  const [pickerEvents, setPickerEvents] = useState<CalendarEvent[]>([]);
  const { locale, t, formatTime } = useI18n();
  const dateLocale = locale === "ko" ? ko : enUS;
  const today = useMemo(() => startOfDay(new Date()), []);
  const scheduleEditable =
    category === "all" || category === "team" || category === "personal";

  useEffect(() => {
    if (view === "month") {
      setSelectedDay(startOfDay(new Date()));
    }
  }, [view, pathname]);

  useEffect(() => {
    setActionDay(null);
  }, [category, view]);

  const meetingEvents = useMemo<CalendarDisplayEvent[]>(
    () =>
      meetings
        .filter((m) => m.confirmedSlot)
        .map((m) => ({
          id: m.id,
          title: m.title,
          date: parseISO(m.confirmedSlot!.start),
          startIso: m.confirmedSlot!.start,
          kind: "meeting" as const,
          meeting: m,
        })),
    [meetings]
  );

  const sideEvents = useMemo<CalendarDisplayEvent[]>(() => {
    return getUserCalendarEvents(calendarEvents, viewingAsUserId).map(
      (event) => ({
        id: event.id,
        title: event.title,
        date: parseISO(event.start),
        startIso: event.start,
        kind: event.category,
      })
    );
  }, [calendarEvents, viewingAsUserId]);

  const filteredEvents = useMemo(() => {
    if (category === "meetings") return meetingEvents;
    if (category === "personal") {
      return sideEvents.filter((event) => event.kind === "personal");
    }
    if (category === "team") {
      return sideEvents.filter((event) => event.kind === "team");
    }
    return [...meetingEvents, ...sideEvents].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }, [category, meetingEvents, sideEvents]);

  const categoryEmptyMessage =
    category === "team"
      ? t.calendar.noTeamSchedules
      : category === "personal"
        ? t.calendar.noPersonalSchedules
        : null;

  const getEventsForDay = (day: Date) =>
    filteredEvents.filter((e) => isSameDay(e.date, day));

  const getEditableEventsForDay = (day: Date) =>
    getUserCalendarEvents(calendarEvents, viewingAsUserId).filter((event) => {
      if (!isSameDay(parseISO(event.start), day)) return false;
      if (category === "personal") return event.category === "personal";
      if (category === "team") return event.category === "team";
      return true;
    });

  const defaultCategoryForForm =
    category === "team" ? "team" : ("personal" as const);

  const openCreateForDay = (day: Date) => {
    setFormMode("create");
    setEditingEvent(null);
    setFormDate(format(day, "yyyy-MM-dd"));
    setFormOpen(true);
    setActionDay(null);
  };

  const openEditForEvents = (events: CalendarEvent[]) => {
    if (events.length === 0) return;
    if (events.length === 1) {
      setFormMode("edit");
      setEditingEvent(events[0]);
      setFormDate(format(parseISO(events[0].start), "yyyy-MM-dd"));
      setFormOpen(true);
      setActionDay(null);
      return;
    }
    setPickerMode("edit");
    setPickerEvents(events);
    setPickerOpen(true);
    setActionDay(null);
  };

  const openDeleteForEvents = (events: CalendarEvent[]) => {
    if (events.length === 0) return;
    if (events.length === 1) {
      if (window.confirm(t.calendar.eventDeleteConfirm)) {
        deleteCalendarEvent(events[0].id);
        toast.success(t.calendar.eventDeleted);
      }
      setActionDay(null);
      return;
    }
    setPickerMode("delete");
    setPickerEvents(events);
    setPickerOpen(true);
    setActionDay(null);
  };

  const handleFormSubmit = (values: CalendarEventFormValues) => {
    const start = toEventIso(values.date, values.startTime);
    const end = toEventIso(values.date, values.endTime);
    if (formMode === "create") {
      addCalendarEvent({
        userId: viewingAsUserId,
        title: values.title,
        start,
        end,
        category: values.category,
      });
      toast.success(t.calendar.eventCreated);
      return;
    }
    if (!editingEvent) return;
    updateCalendarEvent(editingEvent.id, {
      title: values.title,
      start,
      end,
      category: values.category,
    });
    toast.success(t.calendar.eventUpdated);
  };

  const renderDayActionShell = (
    day: Date,
    options: {
      selected: boolean;
      className: string;
      children: ReactNode;
    }
  ) => {
    const dayEvents = getEventsForDay(day);
    const editableEvents = getEditableEventsForDay(day);
    const canRegister = scheduleEditable && dayEvents.length === 0;
    const canEditDelete = scheduleEditable && editableEvents.length > 0;
    const showActions = Boolean(actionDay && isSameDay(actionDay, day));

    return (
      <CalendarDayActionShell
        key={day.toISOString()}
        enabled={scheduleEditable}
        selected={options.selected}
        showActions={showActions}
        canRegister={canRegister}
        canEditDelete={canEditDelete}
        className={options.className}
        onSelect={() => {
          setSelectedDay(startOfDay(day));
          if (actionDay && !isSameDay(actionDay, day)) {
            setActionDay(null);
          }
        }}
        onShowActions={() => setActionDay(startOfDay(day))}
        onRegister={() => openCreateForDay(day)}
        onEdit={() => openEditForEvents(editableEvents)}
        onDelete={() => openDeleteForEvents(editableEvents)}
      >
        {options.children}
      </CalendarDayActionShell>
    );
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (view !== "week") return;

    const inWeek = weekDays.some((day) => isSameDay(day, selectedDay));
    if (!inWeek) {
      const todayInWeek = weekDays.find((day) => isSameDay(day, today));
      setSelectedDay(startOfDay(todayInWeek ?? weekDays[0]));
    }
  }, [view, weekStart, selectedDay, weekDays, today]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthGridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const monthGridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({
    start: monthGridStart,
    end: monthGridEnd,
  });

  useEffect(() => {
    if (view !== "month") return;

    if (!isSameMonth(selectedDay, monthStart)) {
      const todayInMonth = isSameMonth(today, monthStart) ? today : monthStart;
      setSelectedDay(startOfDay(todayInMonth));
    }
  }, [view, monthStart, selectedDay, today]);

  const yearMonths = Array.from({ length: 12 }, (_, i) =>
    startOfMonth(new Date(currentDate.getFullYear(), i, 1))
  );

  const periodLabel = useMemo(() => {
    if (view === "year") {
      return locale === "ko"
        ? format(currentDate, "yyyy년", { locale: dateLocale })
        : format(currentDate, "yyyy", { locale: dateLocale });
    }
    if (view === "month") {
      return locale === "ko"
        ? format(currentDate, "yyyy년 M월", { locale: dateLocale })
        : format(currentDate, "MMMM yyyy", { locale: dateLocale });
    }
    return locale === "ko"
      ? `${format(weekStart, "M월 d일", { locale: dateLocale })} – ${format(weekEnd, "M월 d일", { locale: dateLocale })}`
      : `${format(weekStart, "MMM d", { locale: dateLocale })} – ${format(weekEnd, "MMM d", { locale: dateLocale })}`;
  }, [view, currentDate, weekStart, weekEnd, locale, dateLocale]);

  const navigatePrev = () => {
    if (view === "year") setCurrentDate((d) => addYears(d, -1));
    else if (view === "month") setCurrentDate((d) => addMonths(d, -1));
    else setCurrentDate((d) => addDays(d, -7));
  };

  const navigateNext = () => {
    if (view === "year") setCurrentDate((d) => addYears(d, 1));
    else if (view === "month") setCurrentDate((d) => addMonths(d, 1));
    else setCurrentDate((d) => addDays(d, 7));
  };

  const navAriaLabel =
    view === "year"
      ? { prev: t.calendar.prevYear, next: t.calendar.nextYear }
      : view === "month"
        ? { prev: t.calendar.prevMonth, next: t.calendar.nextMonth }
        : { prev: t.calendar.prevWeek, next: t.calendar.nextWeek };

  const weekdayLabels =
    locale === "ko"
      ? ["월", "화", "수", "목", "금", "토", "일"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const formatDayHeader = (day: Date) =>
    locale === "ko"
      ? format(day, "EEEE, M월 d일", { locale: dateLocale })
      : format(day, "EEEE, MMM d", { locale: dateLocale });

  const countEventsInMonth = (month: Date) =>
    filteredEvents.filter((e) => isSameMonth(e.date, month)).length;

  const selectedYearMonth = yearMonths[selectedMonthIndex];

  const selectedYearMonthEvents = useMemo(
    () =>
      filteredEvents
        .filter((e) => isSameMonth(e.date, selectedYearMonth))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [filteredEvents, selectedYearMonth]
  );

  const selectedYearMonthEventsByDay = useMemo(() => {
    const groups = new Map<string, typeof selectedYearMonthEvents>();
    for (const event of selectedYearMonthEvents) {
      const key = format(event.date, "yyyy-MM-dd");
      const existing = groups.get(key) ?? [];
      existing.push(event);
      groups.set(key, existing);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [selectedYearMonthEvents]);

  const formatMonthDayHeader = (day: Date) =>
    locale === "ko"
      ? format(day, "M월 d일 (EEE)", { locale: dateLocale })
      : format(day, "MMM d (EEE)", { locale: dateLocale });

  const formatYearMonthLabel = (month: Date) =>
    locale === "ko"
      ? format(month, "M월", { locale: dateLocale })
      : format(month, "MMMM", { locale: dateLocale });

  const viewOptions: { id: CalendarView; label: string }[] = [
    { id: "year", label: t.calendar.viewYear },
    { id: "month", label: t.calendar.viewMonth },
    { id: "week", label: t.calendar.viewWeek },
  ];

  const categoryOptions: { id: CalendarCategory; label: string }[] = [
    { id: "meetings", label: t.calendar.categoryMeetings },
    { id: "all", label: t.calendar.categoryAll },
    { id: "team", label: t.calendar.categoryTeam },
    { id: "personal", label: t.calendar.categoryPersonal },
  ];

  const renderEventCard = (
    event: CalendarDisplayEvent,
    size: "card" | "compact" | "week" = "card"
  ) => {
    const styles = eventStylesFor(event.kind);
    const time = formatTime(event.startIso);
    const body =
      size === "compact" ? (
        <div className={styles.compact}>
          <p className={styles.compactTitle}>{event.title}</p>
          <p className={styles.compactTime}>{time}</p>
        </div>
      ) : size === "week" ? (
        <Card className={styles.card}>
          <CardContent className="p-2">
            <p className={cn("text-xs font-medium truncate", styles.cardTitle)}>
              {event.title}
            </p>
            <p className={styles.cardTimeSm}>{time}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className={cn("mb-2", styles.card)}>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className={cn("truncate", styles.cardTitle)}>{event.title}</p>
              <p className={styles.cardTime}>{time}</p>
            </div>
            {event.meeting && (
              <StatusBadge status={event.meeting.status} meeting={event.meeting} />
            )}
          </CardContent>
        </Card>
      );

    if (event.meeting) {
      return (
        <AppLink key={event.id} href={getMeetingDetailPath(event.meeting.id)}>
          {body}
        </AppLink>
      );
    }

    return <div key={event.id}>{body}</div>;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t.calendar.title}
        </h1>
        <p className="text-muted-foreground mt-1">{t.calendar.subtitle}</p>
      </motion.div>

      <Tabs
        value={view}
        onValueChange={(value) => setView(value as CalendarView)}
        className="mb-3"
      >
        <TabsList className="grid h-9 w-full max-w-[240px] grid-cols-3">
          {viewOptions.map((opt) => (
            <TabsTrigger key={opt.id} value={opt.id} className="text-sm">
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Tabs
        value={category}
        onValueChange={(value) => setCategory(value as CalendarCategory)}
        className="mb-4"
      >
        <TabsList className="w-full flex flex-wrap h-auto gap-1">
          {categoryOptions.map((opt) => (
            <TabsTrigger
              key={opt.id}
              value={opt.id}
              className="flex-1 min-w-[88px] text-sm"
            >
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between gap-2 mb-6">
        <Button
          variant="outline"
          size="icon"
          className="touch-target shrink-0"
          onClick={navigatePrev}
          aria-label={navAriaLabel.prev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="flex-1 min-w-0 text-sm font-semibold text-center truncate px-1">
          {periodLabel}
        </p>
        <Button
          variant="outline"
          size="icon"
          className="touch-target shrink-0"
          onClick={navigateNext}
          aria-label={navAriaLabel.next}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {view === "year" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {yearMonths.map((month, index) => {
              const count = countEventsInMonth(month);
              const isSelected = index === selectedMonthIndex;
              const isCurrentMonth =
                isSameMonth(month, today) &&
                month.getFullYear() === today.getFullYear();
              return (
                <button
                  key={month.toISOString()}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedMonthIndex(index)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors hover:bg-accent/50",
                    isSelected
                      ? "border-2 border-[#1A1A1A] bg-accent/30"
                      : "border-border bg-card",
                    !isSelected &&
                      isCurrentMonth &&
                      "ring-1 ring-primary/20"
                  )}
                >
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isSelected && "font-bold",
                      !isSelected && isCurrentMonth && "text-primary"
                    )}
                  >
                    {formatYearMonthLabel(month)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.calendar.meetingCount(count)}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <h3 className="text-base font-semibold mb-4">
              {t.calendar.yearMonthConfirmed(formatYearMonthLabel(selectedYearMonth))}
            </h3>
            {selectedYearMonthEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {categoryEmptyMessage ?? t.calendar.noMeetingsMonth}
              </p>
            ) : (
              <div className="space-y-4">
                {selectedYearMonthEventsByDay.map(([dateKey, dayEvents]) => (
                  <div key={dateKey}>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                      {formatMonthDayHeader(dayEvents[0].date)}
                    </h4>
                    <div className="space-y-2">
                      {dayEvents.map((event) => renderEventCard(event, "card"))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {view === "month" && (
        <>
          <div className="hidden md:block rounded-lg border border-border overflow-hidden bg-card">
            <div className="grid grid-cols-7 border-b border-border">
              {weekdayLabels.map((label, index) => (
                <div
                  key={label}
                  className={cn(
                    "text-center text-xs font-medium text-muted-foreground py-2",
                    index < weekdayLabels.length - 1 && "border-r border-border"
                  )}
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const inMonth = isSameMonth(day, monthStart);
                const isSelected = inMonth && isSameDay(day, selectedDay);
                const colIndex = index % 7;
                const rowIndex = Math.floor(index / 7);
                const totalRows = Math.ceil(monthDays.length / 7);
                const isLastCol = colIndex === 6;
                const isLastRow = rowIndex === totalRows - 1;

                return (
                  <div
                    key={day.toISOString()}
                    role={inMonth ? "button" : undefined}
                    tabIndex={inMonth ? 0 : undefined}
                    onClick={() => inMonth && setSelectedDay(startOfDay(day))}
                    onKeyDown={(e) => {
                      if (inMonth && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        setSelectedDay(startOfDay(day));
                      }
                    }}
                    className={cn(
                      "min-h-[120px] p-1.5 transition-colors",
                      !isLastCol && "border-r border-border",
                      !isLastRow && "border-b border-border",
                      inMonth ? "bg-card cursor-pointer" : "bg-muted/30 opacity-60",
                      isSelected && "relative z-10 border-2 border-[#1A1A1A]"
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-medium mb-1 text-center",
                        isSelected
                          ? "font-bold text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </p>
                    <div
                      className="space-y-1"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {dayEvents.slice(0, 2).map((event) =>
                        renderEventCard(event, "compact")
                      )}
                      {dayEvents.length > 2 && (
                        <p className="text-[9px] text-muted-foreground text-center">
                          +{dayEvents.length - 2}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="md:hidden">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekdayLabels.map((label) => (
                <div
                  key={label}
                  className="text-center text-xs font-medium text-muted-foreground py-1"
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {monthDays.map((day) => {
                const inMonth = isSameMonth(day, monthStart);
                const isSelected = inMonth && isSameDay(day, selectedDay);
                const isToday = inMonth && isSameDay(day, today);
                const dayEvents = getEventsForDay(day);
                if (!inMonth) {
                  return (
                    <div
                      key={day.toISOString()}
                      className="opacity-0 pointer-events-none min-h-[44px]"
                    />
                  );
                }
                return renderDayActionShell(day, {
                  selected: isSelected,
                  className: cn(
                    "relative flex w-full flex-col items-center justify-center rounded-lg py-2 min-h-[44px] text-sm font-medium transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent/50",
                    isToday && !isSelected && "text-primary font-semibold"
                  ),
                  children: (
                    <>
                      <span>{format(day, "d")}</span>
                      {dayEvents.length > 0 && (
                        <span
                          className={cn(
                            "absolute bottom-1 h-1 w-1 rounded-full",
                            isSelected ? "bg-primary-foreground" : "bg-primary"
                          )}
                        />
                      )}
                    </>
                  ),
                });
              })}
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {formatDayHeader(selectedDay)}
              </h3>
              {getEventsForDay(selectedDay).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {categoryEmptyMessage ?? t.calendar.noEventsOnDay}
                </p>
              ) : (
                getEventsForDay(selectedDay).map((event) =>
                  renderEventCard(event, "card")
                )
              )}
            </div>
          </div>
        </>
      )}

      {view === "week" && (
        <>
          <div className="hidden md:grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isSelected = isSameDay(day, selectedDay);
              const isToday = isSameDay(day, today);
              return (
                <div key={day.toISOString()} className="min-h-[200px]">
                  {renderDayActionShell(day, {
                    selected: isSelected,
                    className: cn(
                      "w-full text-center py-2 rounded-lg mb-2 text-sm font-medium transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent/50",
                      isToday && !isSelected && "text-primary"
                    ),
                    children: (
                      <>
                        <p className="text-xs">
                          {format(day, "EEE", { locale: dateLocale })}
                        </p>
                        <p>{format(day, "d")}</p>
                      </>
                    ),
                  })}
                  <div className="space-y-2">
                    {dayEvents.map((event) => renderEventCard(event, "week"))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="md:hidden">
            <div className="grid grid-cols-7 gap-1 mb-4">
              {weekDays.map((day) => {
                const isSelected = isSameDay(day, selectedDay);
                const isToday = isSameDay(day, today);
                return renderDayActionShell(day, {
                  selected: isSelected,
                  className: cn(
                    "flex w-full flex-col items-center justify-center py-2 rounded-xl text-sm font-medium transition-colors min-h-[56px]",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent/50",
                    isToday && !isSelected && "text-primary"
                  ),
                  children: (
                    <>
                      <p className="text-xs">
                        {format(day, "EEE", { locale: dateLocale })}
                      </p>
                      <p>{format(day, "d")}</p>
                    </>
                  ),
                });
              })}
            </div>
            <div className="space-y-3">
              {getEventsForDay(selectedDay).length === 0 ? (
                <p className="text-center text-muted-foreground py-12">
                  {categoryEmptyMessage ?? t.calendar.noEventsOnDay}
                </p>
              ) : (
                getEventsForDay(selectedDay).map((event) =>
                  renderEventCard(event, "card")
                )
              )}
            </div>
          </div>
        </>
      )}

      <Card className="mt-8 border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground">
          <p className="text-sm font-medium">{t.calendar.integration}</p>
          <p className="text-xs mt-1">{t.calendar.integrationHint}</p>
        </CardContent>
      </Card>

      <CalendarEventFormModal
        open={formOpen}
        mode={formMode}
        formKey={
          formMode === "edit" && editingEvent
            ? editingEvent.id
            : `create-${formDate}`
        }
        lockCategory={category === "personal" || category === "team"}
        initial={
          formMode === "edit" && editingEvent
            ? eventToFormValues(editingEvent)
            : {
                date: formDate,
                category: defaultCategoryForForm,
                title: "",
                startTime: "10:00",
                endTime: "11:00",
              }
        }
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
      />

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {pickerMode === "edit"
                ? t.calendar.eventPickEdit
                : t.calendar.eventPickDelete}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {pickerEvents.map((event) => (
              <Button
                key={event.id}
                type="button"
                variant="outline"
                className="w-full justify-start h-auto py-3"
                onClick={() => {
                  if (pickerMode === "edit") {
                    setFormMode("edit");
                    setEditingEvent(event);
                    setFormDate(format(parseISO(event.start), "yyyy-MM-dd"));
                    setPickerOpen(false);
                    setFormOpen(true);
                    return;
                  }
                  if (window.confirm(t.calendar.eventDeleteConfirm)) {
                    deleteCalendarEvent(event.id);
                    toast.success(t.calendar.eventDeleted);
                  }
                  setPickerOpen(false);
                }}
              >
                <span className="truncate">
                  {event.title} · {formatTime(event.start)}
                </span>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>
              {t.common.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
