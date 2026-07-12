"use client";

import { Calendar, Clock, MapPin, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/meetings/status-badge";
import { MeetingUrgentLabel } from "@/components/meetings/meeting-urgent-label";
import { getParticipantCount } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Meeting } from "@/types";

interface PreferredNotConfirmationDialogProps {
  open: boolean;
  meeting?: Meeting;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  onDecline: () => void;
}

export function PreferredNotConfirmationDialog({
  open,
  meeting,
  onOpenChange,
  onAccept,
  onDecline,
}: PreferredNotConfirmationDialogProps) {
  const { t, formatDate, formatTime, formatDuration, formatScheduledDateRange } =
    useI18n();

  if (!meeting) return null;

  const timeSlot = meeting.confirmedSlot;
  const isConfirmed = meeting.status === "confirmed";
  const meetingTimeLabel = timeSlot
    ? `${formatTime(timeSlot.start)} – ${formatTime(timeSlot.end)}`
    : formatDuration(meeting.duration);
  const dateLabel = isConfirmed ? t.meetings.confirmedDate : t.meetings.scheduledDate;
  const dateValueLabel = isConfirmed
    ? timeSlot
      ? formatDate(timeSlot.start)
      : t.meetings.notSet
    : meeting.candidateDateRange.start && meeting.candidateDateRange.end
      ? formatScheduledDateRange(
          meeting.candidateDateRange.start,
          meeting.candidateDateRange.end
        )
      : timeSlot
        ? formatDate(timeSlot.start)
        : t.meetings.notSet;

  const summaryItems = [
    {
      icon: Calendar,
      label: dateLabel,
      value: dateValueLabel,
    },
    {
      icon: Clock,
      label: t.meetings.meetingTime,
      value: meetingTimeLabel,
    },
    {
      icon: MapPin,
      label: t.meetings.location,
      value: meeting.location || t.meetings.notSet,
    },
    {
      icon: Users,
      label: t.meetings.attendeesLabel,
      value: `${getParticipantCount(meeting)}${t.common.people}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.preferredNotConfirmation.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={meeting.status} meeting={meeting} />
              <MeetingUrgentLabel priority={meeting.priority} />
            </div>
            <div>
              <p className="font-semibold text-base">{meeting.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {meeting.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {summaryItems.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="rounded-md border bg-background p-3 flex items-start gap-2"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogDescription className="text-foreground/90 leading-relaxed text-sm space-y-1">
            <span className="block">{t.preferredNotConfirmation.bodyLine1}</span>
            <span className="block">{t.preferredNotConfirmation.bodyLine2}</span>
          </DialogDescription>

          <p className="text-xs text-muted-foreground/70">
            <span className="text-muted-foreground">*</span>
            {t.preferredNotConfirmation.footnote}
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button className="w-full" variant="success" onClick={onAccept}>
            {t.preferredNotConfirmation.accept}
          </Button>
          <Button className="w-full" variant="outline" onClick={onDecline}>
            {t.preferredNotConfirmation.decline}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
