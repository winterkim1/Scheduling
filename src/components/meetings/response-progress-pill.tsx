"use client";

import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface ResponseProgressPillProps {
  responded: number;
  total: number;
  allComplete: boolean;
}

export function ResponseProgressPill({
  responded,
  total,
  allComplete,
}: ResponseProgressPillProps) {
  const { t } = useI18n();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none",
        allComplete
          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400"
          : "border-border bg-muted/40 text-muted-foreground"
      )}
    >
      <UserRound className="h-3 w-3 shrink-0" />
      {allComplete ? (
        <span>{t.meetings.allResponsesShort}</span>
      ) : (
        <span className="inline-flex items-center gap-0.5">
          <span>{t.meetings.responseProgressLabel}</span>
          <span className="text-green-600 dark:text-green-400">{responded}</span>
          <span>/{total}</span>
        </span>
      )}
    </span>
  );
}

interface AttendanceProgressPillProps {
  attending: number;
  total: number;
  allAttending: boolean;
}

export function AttendanceProgressPill({
  attending,
  total,
  allAttending,
}: AttendanceProgressPillProps) {
  const { t } = useI18n();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none",
        allAttending
          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400"
          : "border-border bg-muted/40 text-muted-foreground"
      )}
    >
      <UserRound className="h-3 w-3 shrink-0" />
      {allAttending ? (
        <span>{t.meetings.fullAttendance}</span>
      ) : (
        <span className="inline-flex items-center gap-0.5">
          <span className="text-green-600 dark:text-green-400">{attending}</span>
          <span>/{total}</span>
        </span>
      )}
    </span>
  );
}
