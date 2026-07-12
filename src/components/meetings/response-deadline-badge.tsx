"use client";

import { Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ResponseDeadlineBadgeProps {
  deadline: string;
  className?: string;
}

export function ResponseDeadlineBadge({
  deadline,
  className,
}: ResponseDeadlineBadgeProps) {
  const { t, formatResponseDeadline } = useI18n();

  if (!deadline) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground shrink-0",
        className
      )}
    >
      <Clock className="h-3 w-3 shrink-0" />
      <span>{t.meetings.responseDeadlineLabel}</span>
      <span>{formatResponseDeadline(deadline)}</span>
    </span>
  );
}
