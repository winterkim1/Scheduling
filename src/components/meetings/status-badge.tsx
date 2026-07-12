"use client";

import { Badge } from "@/components/ui/badge";
import type { Meeting, MeetingStatus } from "@/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { isPastMeeting } from "@/lib/meeting-utils";

const statusVariants: Record<
  MeetingStatus,
  "default" | "secondary" | "success" | "warning" | "info" | "destructive"
> = {
  draft: "secondary",
  invitation_sent: "info",
  availability_collection: "warning",
  matching: "info",
  recommendation: "info",
  pending_confirmation: "warning",
  confirmed: "success",
  change_requested: "destructive",
  re_matching: "warning",
};

interface StatusBadgeProps {
  status: MeetingStatus;
  meeting?: Meeting;
  className?: string;
}

export function StatusBadge({ status, meeting, className }: StatusBadgeProps) {
  const { t } = useI18n();
  const showAttended = status === "confirmed" && meeting && isPastMeeting(meeting);

  if (showAttended) {
    return (
      <Badge variant="purple" className={cn("font-medium", className)}>
        {t.status.attended}
      </Badge>
    );
  }

  return (
    <Badge variant={statusVariants[status]} className={cn("font-medium", className)}>
      {t.status[status]}
    </Badge>
  );
}
