"use client";

import { useMemo, useState } from "react";
import { AppLink } from "@/components/app-link";
import { motion } from "framer-motion";
import {
  addDays,
  endOfDay,
  endOfWeek,
  isWithinInterval,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MeetingCard } from "@/components/meetings/meeting-card";
import {
  PastPeriodPicker,
  formatPastPeriodLabel,
  shiftDateRange,
  type DateRange,
} from "@/components/meetings/past-period-picker";
import { useShallow } from "zustand/react/shallow";
import { useMeetingStore } from "@/store/meeting-store";
import { useI18n } from "@/lib/i18n";
import {
  isActiveMeeting,
  isPastMeeting,
  isUpcomingConfirmed,
  getMeetingEventDate,
} from "@/lib/meeting-utils";
import { cn } from "@/lib/utils";

function createDefaultPastRange(): DateRange {
  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), -14);
  return {
    start: startOfDay(weekStart),
    end: endOfDay(endOfWeek(weekStart, { weekStartsOn: 1 })),
  };
}

export default function MeetingsPage() {
  const meetings = useMeetingStore(useShallow((s) => s.getOrganizerMeetings()));
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<DateRange>(() => createDefaultPastRange());
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);
  const { locale, t } = useI18n();
  const dateLocale = locale === "ko" ? ko : enUS;

  const filtered = meetings.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
  );

  const active = filtered.filter(isActiveMeeting);
  const confirmed = filtered.filter(isUpcomingConfirmed);
  const drafts = filtered.filter((m) => m.status === "draft");
  const past = filtered.filter(isPastMeeting);

  const pastDisplayed = useMemo(() => {
    return past
      .filter((m) => {
        const d = getMeetingEventDate(m);
        return (
          d &&
          isWithinInterval(d, {
            start: startOfDay(period.start),
            end: endOfDay(period.end),
          })
        );
      })
      .sort((a, b) => {
        const da = getMeetingEventDate(a)!.getTime();
        const db = getMeetingEventDate(b)!.getTime();
        return db - da;
      });
  }, [past, period]);

  const periodLabel = formatPastPeriodLabel(period, locale, dateLocale);

  const canGoNext = startOfDay(period.end).getTime() < startOfDay(new Date()).getTime();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t.meetings.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.meetings.subtitle}</p>
        </div>
        <AppLink href="/meetings/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {t.nav.newMeeting}
          </Button>
        </AppLink>
      </motion.div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.meetings.search}
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-4 w-full flex flex-wrap h-auto gap-1">
          <TabsTrigger value="active" className="flex-1 min-w-[72px]">
            {t.meetings.active} ({active.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="flex-1 min-w-[72px]">
            {t.meetings.confirmed} ({confirmed.length})
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex-1 min-w-[72px]">
            {t.meetings.drafts} ({drafts.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1 min-w-[72px]">
            {t.meetings.past} ({pastDisplayed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {active.length > 0 ? (
            active.map((m) => <MeetingCard key={m.id} meeting={m} />)
          ) : (
            <p className="text-center text-muted-foreground py-12">
              {t.meetings.noActive}
            </p>
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-3">
          {confirmed.length > 0 ? (
            confirmed.map((m) => (
              <MeetingCard key={m.id} meeting={m} showProgress={false} />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-12">
              {t.meetings.noConfirmed}
            </p>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-3">
          {drafts.length > 0 ? (
            drafts.map((m) => <MeetingCard key={m.id} meeting={m} />)
          ) : (
            <p className="text-center text-muted-foreground py-12">
              {t.meetings.noDrafts}
            </p>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          <div className="rounded-lg border p-4 bg-card relative">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 self-center"
                onClick={() => setPeriod((current) => shiftDateRange(current, -1))}
                aria-label={t.meetings.prevWeek}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="relative flex-1 min-w-0 text-center">
                <button
                  type="button"
                  onClick={() => setPeriodPickerOpen((open) => !open)}
                  className={cn(
                    "w-full text-sm font-semibold text-center py-1.5 px-2 rounded-md",
                    "hover:bg-accent transition-colors",
                    periodPickerOpen && "bg-accent"
                  )}
                  aria-expanded={periodPickerOpen}
                  aria-label={t.meetings.selectWeekPeriod}
                >
                  {periodLabel}
                </button>
                <p className="text-xs text-muted-foreground mt-[calc(0.5rem-2mm)]">
                  {t.meetings.selectWeekPeriodHint}
                </p>
                <PastPeriodPicker
                  open={periodPickerOpen}
                  range={period}
                  onOpenChange={setPeriodPickerOpen}
                  onChange={setPeriod}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 self-center"
                onClick={() => setPeriod((current) => shiftDateRange(current, 1))}
                disabled={!canGoNext}
                aria-label={t.meetings.nextWeek}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {pastDisplayed.length > 0 ? (
            pastDisplayed.map((m) => (
              <MeetingCard key={m.id} meeting={m} showProgress={false} />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-12">
              {t.meetings.noPastInWeek}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
