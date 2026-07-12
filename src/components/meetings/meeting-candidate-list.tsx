"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Meeting, Recommendation } from "@/types";

interface MeetingCandidateListProps {
  meeting: Meeting;
  onSelect: (recommendation: Recommendation) => void;
}

type DayGroup = {
  dateKey: string;
  slots: Recommendation[];
};

/** Group priority-ranked candidates (typically top 1–3 overall) by date. */
function groupByDate(recommendations: Recommendation[]): DayGroup[] {
  const map = new Map<string, Recommendation[]>();
  for (const rec of recommendations) {
    if (rec.rank < 1) continue;
    const dateKey = rec.slot.date;
    const list = map.get(dateKey) ?? [];
    list.push(rec);
    map.set(dateKey, list);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, slots]) => ({
      dateKey,
      slots: slots.sort((a, b) => a.rank - b.rank),
    }));
}

export function MeetingCandidateList({
  meeting,
  onSelect,
}: MeetingCandidateListProps) {
  const { locale, t, formatTime } = useI18n();
  const dateLocale = locale === "ko" ? ko : enUS;
  const [openDate, setOpenDate] = useState<string | null>(null);

  const groups = useMemo(
    () => groupByDate(meeting.recommendations),
    [meeting.recommendations]
  );

  if (groups.length === 0) {
    return (
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {t.meetings.meetingTimeCandidates}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t.meetings.candidateListEmpty}
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-4">
        {t.meetings.meetingTimeCandidates}
      </h2>
      <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        {groups.map((group) => {
          const isOpen = openDate === group.dateKey;
          const dateLabel = format(
            parseISO(group.dateKey),
            locale === "ko" ? "M월 d일 (EEE)" : "EEE, MMM d",
            { locale: dateLocale }
          );
          const ranksLabel = group.slots
            .map((slot) => t.confirmationRequestModal.rank(slot.rank))
            .join(", ");

          return (
            <div key={group.dateKey}>
              <button
                type="button"
                onClick={() =>
                  setOpenDate((prev) =>
                    prev === group.dateKey ? null : group.dateKey
                  )
                }
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
                aria-expanded={isOpen}
              >
                <div>
                  <p className="font-medium">{dateLabel}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.meetings.candidateDaySummary(
                      group.slots.length,
                      ranksLabel
                    )}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              {isOpen && (
                <div className="border-t border-border bg-muted/20">
                  <div className="hidden sm:grid sm:grid-cols-[auto_1fr_1fr_auto] gap-3 px-4 py-2 text-xs font-medium text-muted-foreground">
                    <span className="w-10">{t.meetings.candidateRankColumn}</span>
                    <span>{t.meetings.candidateTimeColumn}</span>
                    <span>{t.meetings.candidateAttendanceColumn}</span>
                    <span className="w-[7.5rem]" />
                  </div>
                  <ul className="divide-y divide-border/70">
                    {group.slots.map((rec) => (
                      <li
                        key={rec.slot.id}
                        className="flex flex-col gap-3 sm:grid sm:grid-cols-[auto_1fr_1fr_auto] sm:items-center sm:gap-3 px-4 py-3"
                      >
                        <div className="flex items-center gap-2 sm:w-10">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">
                            {rec.rank}
                          </span>
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {t.confirmationRequestModal.rank(rec.rank)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground sm:hidden mb-0.5">
                            {t.meetings.candidateTimeColumn}
                          </p>
                          <p className="text-sm font-medium">
                            {formatTime(rec.slot.start)} –{" "}
                            {formatTime(rec.slot.end)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground sm:hidden mb-0.5">
                            {t.meetings.candidateAttendanceColumn}
                          </p>
                          <p className="text-sm">
                            {t.meetings.attendanceSummary(
                              rec.overallAttendance,
                              rec.totalAttendees
                            )}
                            <span className="text-muted-foreground">
                              {" · "}
                              {t.recommendation.reasonRequired(
                                rec.requiredAttendance,
                                rec.requiredTotal
                              )}
                              {rec.optionalTotal > 0 &&
                                ` · ${t.recommendation.reasonOptional(
                                  rec.optionalAttendance,
                                  rec.optionalTotal
                                )}`}
                            </span>
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="w-full sm:w-[7.5rem]"
                          onClick={() => onSelect(rec)}
                        >
                          {t.recommendation.selectTime}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
