"use client";

import { useEffect, useMemo, useState } from "react";
import { differenceInMinutes, format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChangeRequestReason, Meeting } from "@/types";
import { useI18n } from "@/lib/i18n";
import {
  ChangeReasonFields,
  buildChangeReasonNote,
  canSubmitChangeReason,
} from "@/components/meetings/change-reason-fields";

const DURATION_OPTIONS = [30, 45, 60, 90, 120];
const DAY_START_MINUTES = 9 * 60;
const DAY_END_MINUTES = 17 * 60;

export type OrganizerScheduleChangePayload = {
  date: string;
  time: string;
  duration: number;
  reason: ChangeRequestReason;
  note?: string;
};

interface OrganizerScheduleChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Meeting;
  onConfirm: (payload: OrganizerScheduleChangePayload) => void;
}

function formatMinutesAsTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildTimeRangeOptions(duration: number): { value: string; label: string }[] {
  if (duration <= 0) return [];
  const options: { value: string; label: string }[] = [];
  for (
    let start = DAY_START_MINUTES;
    start + duration <= DAY_END_MINUTES;
    start += duration
  ) {
    options.push({
      value: formatMinutesAsTime(start),
      label: `${formatMinutesAsTime(start)}~${formatMinutesAsTime(start + duration)}`,
    });
  }
  return options;
}

function defaultsFromMeeting(meeting: Meeting) {
  const slot = meeting.confirmedSlot;
  const duration =
    slot != null
      ? Math.max(15, differenceInMinutes(parseISO(slot.end), parseISO(slot.start)))
      : meeting.duration;

  if (!slot) {
    return {
      date: meeting.candidateDateRange.start || "",
      time: "09:00",
      duration: meeting.duration || 60,
    };
  }

  return {
    date: slot.date || format(parseISO(slot.start), "yyyy-MM-dd"),
    time: format(parseISO(slot.start), "HH:mm"),
    duration: DURATION_OPTIONS.includes(duration) ? duration : meeting.duration || 60,
  };
}

export function OrganizerScheduleChangeModal({
  open,
  onOpenChange,
  meeting,
  onConfirm,
}: OrganizerScheduleChangeModalProps) {
  const { t, formatDuration } = useI18n();
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState(60);
  const [time, setTime] = useState("");
  const [reason, setReason] = useState<ChangeRequestReason>("other");
  const [customText, setCustomText] = useState("");
  const [note, setNote] = useState("");

  const timeOptions = useMemo(
    () => buildTimeRangeOptions(duration),
    [duration]
  );

  useEffect(() => {
    if (!open) return;
    const defaults = defaultsFromMeeting(meeting);
    setStep("form");
    setDate(defaults.date);
    setDuration(defaults.duration);
    setReason("other");
    setCustomText("");
    setNote("");

    const options = buildTimeRangeOptions(defaults.duration);
    const matched = options.find((option) => option.value === defaults.time);
    setTime(matched?.value ?? options[0]?.value ?? "");
  }, [open, meeting]);

  useEffect(() => {
    if (!open) return;
    if (timeOptions.length === 0) {
      setTime("");
      return;
    }
    if (!timeOptions.some((option) => option.value === time)) {
      setTime(timeOptions[0].value);
    }
  }, [open, time, timeOptions]);

  const canSubmitForm =
    Boolean(date && time) && canSubmitChangeReason(reason, customText);

  const handleOpenChange = (next: boolean) => {
    if (!next) setStep("form");
    onOpenChange(next);
  };

  const handleSubmitForm = () => {
    if (!canSubmitForm) return;
    setStep("confirm");
  };

  const handleConfirmNotify = () => {
    onConfirm({
      date,
      time,
      duration,
      reason,
      note: buildChangeReasonNote(reason, customText, note),
    });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>{t.organizerScheduleChange.title}</DialogTitle>
              <DialogDescription>
                {t.organizerScheduleChange.description(meeting.title)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="organizer-change-date">
                    {t.organizerScheduleChange.date}
                  </Label>
                  <Input
                    id="organizer-change-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2 min-w-0">
                  <Label htmlFor="organizer-change-duration">
                    {t.organizerScheduleChange.duration}
                  </Label>
                  <Select
                    value={String(duration)}
                    onValueChange={(value) => setDuration(Number(value))}
                  >
                    <SelectTrigger id="organizer-change-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((mins) => (
                        <SelectItem key={mins} value={String(mins)}>
                          {formatDuration(mins)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 min-w-0">
                  <Label htmlFor="organizer-change-time">
                    {t.organizerScheduleChange.time}
                  </Label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger id="organizer-change-time">
                      <SelectValue
                        placeholder={t.organizerScheduleChange.timePlaceholder}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ChangeReasonFields
                reasonId="organizer-change-reason"
                noteId="organizer-change-note"
                customId="organizer-change-custom"
                reason={reason}
                onReasonChange={setReason}
                customText={customText}
                onCustomTextChange={setCustomText}
                note={note}
                onNoteChange={setNote}
                notePlaceholder={t.organizerScheduleChange.notesPlaceholder}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t.common.cancel}
              </Button>
              <Button onClick={handleSubmitForm} disabled={!canSubmitForm}>
                {t.organizerScheduleChange.submit}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t.organizerScheduleChange.confirmTitle}</DialogTitle>
              <DialogDescription>
                {t.organizerScheduleChange.confirmDescription}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("form")}>
                {t.organizerScheduleChange.no}
              </Button>
              <Button onClick={handleConfirmNotify}>
                {t.organizerScheduleChange.yes}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
