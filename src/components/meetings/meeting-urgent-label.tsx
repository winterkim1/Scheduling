"use client";

import { useI18n } from "@/lib/i18n";
import type { MeetingPriority } from "@/types";

export function MeetingUrgentLabel({ priority }: { priority: MeetingPriority }) {
  const { t } = useI18n();

  if (priority !== "urgent") return null;

  return (
    <span className="text-xs font-medium text-red-600 dark:text-red-500">
      {t.priority.urgent}
    </span>
  );
}
