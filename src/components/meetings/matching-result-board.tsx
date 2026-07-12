"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAvailabilityForUser,
  getOrganizerSlotRoster,
  hasConfirmableRecommendation,
  isConfirmableRecommendation,
} from "@/lib/matching-engine";
import {
  getPreferredTimeBandPercents,
  PREFERRED_TIME_BANDS,
} from "@/lib/preferred-time-band";
import { useI18n } from "@/lib/i18n";
import { getUserById } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { Meeting, TimeSlot } from "@/types";

interface MatchingResultBoardProps {
  meeting: Meeting;
  viewingAsUserId: string;
}

type GridCell = {
  slot: TimeSlot;
  availableCount: number;
  requiredAvailable: number;
  requiredTotal: number;
  optionalAvailable: number;
  optionalTotal: number;
  total: number;
};

function getParticipants(meeting: Meeting) {
  return [
    meeting.organizerId,
    ...meeting.attendees.map((attendee) => attendee.userId),
  ];
}

function buildGrid(meeting: Meeting): {
  dates: string[];
  times: string[];
  cells: Record<string, GridCell>;
} {
  const requiredIds = new Set(
    meeting.attendees.filter((a) => a.isRequired).map((a) => a.userId)
  );
  const optionalIds = [
    meeting.organizerId,
    ...meeting.attendees.filter((a) => !a.isRequired).map((a) => a.userId),
  ];
  const participants = getParticipants(meeting);
  const total = participants.length;
  const requiredTotal = requiredIds.size;
  const optionalTotal = optionalIds.length;
  const duration = Math.max(15, meeting.duration);
  const workStartMinutes = 9 * 60;

  const cells: Record<string, GridCell> = {};
  const dateSet = new Set<string>();
  const timeSet = new Set<string>();

  for (const slot of meeting.candidateSlots) {
    const start = parseISO(slot.start);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    if ((startMinutes - workStartMinutes) % duration !== 0) continue;

    const dateKey = slot.date;
    const timeKey = `${format(start, "HH:mm")}~${format(
      parseISO(slot.end),
      "HH:mm"
    )}`;
    dateSet.add(dateKey);
    timeSet.add(timeKey);

    let availableCount = 0;
    let requiredAvailable = 0;
    let optionalAvailable = 0;

    for (const userId of participants) {
      const state = getAvailabilityForUser(meeting.availability, userId, slot.id);
      if (state !== "available") continue;
      availableCount += 1;
      if (requiredIds.has(userId)) requiredAvailable += 1;
      if (optionalIds.includes(userId)) optionalAvailable += 1;
    }

    cells[`${dateKey}|${timeKey}`] = {
      slot,
      availableCount,
      requiredAvailable,
      requiredTotal,
      optionalAvailable,
      optionalTotal,
      total,
    };
  }

  return {
    dates: Array.from(dateSet).sort(),
    times: Array.from(timeSet).sort(),
    cells,
  };
}

/** 초록 전원가능 · 노랑 선택일부불가 · 빨강 필수만가능 · 흰색 필수불가 */
function cellFill(cell: GridCell) {
  const requiredOk = cell.requiredAvailable === cell.requiredTotal;
  if (!requiredOk) {
    return "bg-white text-muted-foreground dark:bg-transparent";
  }
  if (cell.optionalAvailable === cell.optionalTotal) {
    return "bg-green-50 text-green-900 dark:bg-green-900/25 dark:text-green-300";
  }
  if (cell.optionalAvailable === 0) {
    return "bg-red-50 text-red-900 dark:bg-red-900/25 dark:text-red-300";
  }
  return "bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-300";
}

export function MatchingResultBoard({
  meeting,
  viewingAsUserId,
}: MatchingResultBoardProps) {
  const { locale, t, formatDate, formatTime } = useI18n();
  const dateLocale = locale === "ko" ? ko : enUS;
  const [gridOpen, setGridOpen] = useState(false);

  const { dates, times, cells } = useMemo(() => buildGrid(meeting), [meeting]);

  const preferencePercents = useMemo(
    () => getPreferredTimeBandPercents(meeting),
    [meeting]
  );
  const hasPreferenceVotes = Object.values(
    meeting.preferredTimeBandsByUser ?? {}
  ).some((bands) => bands.length > 0);

  const interpretation = useMemo(() => {
    const top = meeting.recommendations[0];
    if (!top) return null;

    const formatSlotRange = (slotStart: string, slotEnd: string) => {
      const start = parseISO(slotStart);
      const end = parseISO(slotEnd);
      const datePart = format(
        start,
        locale === "ko" ? "M/d(EEE)" : "MMM d (EEE)",
        { locale: dateLocale }
      );
      const startTime = format(start, "HH:mm");
      const endTime = format(end, "HH:mm");
      return `${datePart} ${startTime}~${endTime}`;
    };

    const anyConfirmable = hasConfirmableRecommendation(meeting.recommendations);
    if (anyConfirmable) {
      const ready =
        meeting.recommendations.find(isConfirmableRecommendation) ?? top;
      return {
        tone: "ok" as const,
        text: t.meetings.matchingResultFullOk(
          formatSlotRange(ready.slot.start, ready.slot.end)
        ),
      };
    }
    const roster = getOrganizerSlotRoster(
      meeting,
      top.slot.id,
      viewingAsUserId,
      (userId) => getUserById(userId, locale)?.name ?? t.common.unknown
    );
    const followUp = roster.filter((p) => p.action !== "none").length;
    return {
      tone: "fallback" as const,
      text: t.meetings.matchingResultFallback(
        formatSlotRange(top.slot.start, top.slot.end),
        followUp
      ),
    };
  }, [meeting, viewingAsUserId, locale, t, dateLocale]);

  if (dates.length === 0 || times.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <Card>
        <CardHeader className="py-4">
          <button
            type="button"
            onClick={() => setGridOpen((open) => !open)}
            className="relative flex w-full flex-col items-start gap-1 text-left"
            aria-expanded={gridOpen}
          >
            <div className="flex w-full items-center justify-between gap-3">
              <CardTitle className="text-base">
                {t.meetings.matchingResult}
              </CardTitle>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                  gridOpen && "rotate-180"
                )}
              />
            </div>
            {interpretation && (
              <p
                className={cn(
                  "text-sm font-medium w-full",
                  interpretation.tone === "ok"
                    ? "text-green-800 dark:text-green-300"
                    : "text-amber-800 dark:text-amber-300"
                )}
              >
                {interpretation.text}
              </p>
            )}
            <div className="flex w-full items-baseline justify-between gap-3">
              <p className="text-sm text-muted-foreground min-w-0">
                {gridOpen
                  ? t.meetings.matchingResultHint
                  : t.meetings.matchingResultCollapsedHint}
              </p>
              {gridOpen && (
                <p className="text-sm text-muted-foreground whitespace-nowrap shrink-0">
                  {hasPreferenceVotes
                    ? `${t.meetings.matchingPreferenceTitle}: ${PREFERRED_TIME_BANDS.map(
                        (band) =>
                          `${t.availabilityPage.preferredTimeBands[band]} ${preferencePercents[band]}%`
                      ).join(" · ")}`
                    : `${t.meetings.matchingPreferenceTitle}: ${t.meetings.matchingPreferenceEmpty}`}
                </p>
              )}
            </div>
          </button>
        </CardHeader>

        {gridOpen && (
          <CardContent className="space-y-4 pt-0">
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="min-w-[520px] rounded-xl border border-border overflow-hidden bg-card">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="sticky left-0 z-10 bg-muted/40 text-center text-xs font-medium text-muted-foreground px-2 py-2.5 w-28 border-b border-r border-border">
                        {t.meetings.matchingResultTime}
                      </th>
                      {dates.map((date, dateIndex) => (
                        <th
                          key={date}
                          className={cn(
                            "text-center text-xs font-semibold px-2 py-2.5 min-w-[72px] border-b border-border",
                            dateIndex < dates.length - 1 && "border-r"
                          )}
                        >
                          {format(
                            parseISO(date),
                            locale === "ko" ? "M/d(EEE)" : "MMM d",
                            { locale: dateLocale }
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {times.map((time, timeIndex) => (
                      <tr key={time}>
                        <th
                          className={cn(
                            "sticky left-0 z-10 bg-card text-center text-[11px] font-medium text-muted-foreground px-2 border-r border-border whitespace-nowrap h-11 align-middle",
                            timeIndex < times.length - 1 && "border-b"
                          )}
                        >
                          {time}
                        </th>
                        {dates.map((date, dateIndex) => {
                          const key = `${date}|${time}`;
                          const cell = cells[key];
                          const isLastCol = dateIndex === dates.length - 1;
                          const isLastRow = timeIndex === times.length - 1;

                          if (!cell) {
                            return (
                              <td
                                key={key}
                                className={cn(
                                  "p-0 h-11",
                                  !isLastCol && "border-r border-border",
                                  !isLastRow && "border-b border-border"
                                )}
                              />
                            );
                          }

                          return (
                            <td
                              key={key}
                              className={cn(
                                "p-0 relative",
                                !isLastCol && "border-r border-border",
                                !isLastRow && "border-b border-border"
                              )}
                            >
                              <div
                                className={cn(
                                  "relative w-full h-11 flex items-center justify-center text-sm font-semibold",
                                  cellFill(cell)
                                )}
                                aria-label={`${formatDate(cell.slot.start)} ${formatTime(cell.slot.start)} ${cell.availableCount}/${cell.total}`}
                              >
                                {cell.availableCount}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {t.meetings.matchingResultLegend}
            </p>
          </CardContent>
        )}
      </Card>
    </section>
  );
}
