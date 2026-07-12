"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import type { Meeting } from "@/types";

export type ConfirmationMessagePreset =
  | "checkAttendance"
  | "preferredNot"
  | "noResponse"
  | "requiredAdjust"
  | "conflict"
  | "custom";

const MESSAGE_PRESETS: ConfirmationMessagePreset[] = [
  "checkAttendance",
  "preferredNot",
  "noResponse",
  "requiredAdjust",
  "conflict",
  "custom",
];

const CUSTOM_SLOT_ID = "__custom__";

export type ConfirmationSlotOption = {
  id: string;
  slotStart: string;
  label: string;
  recommendationIndex?: number;
};

interface ConfirmationRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Meeting;
  attendeeName: string;
  defaultRecommendationIndex?: number | null;
  onSubmit: (payload: {
    slotStart: string;
    message: string;
    recommendationIndex?: number;
  }) => void;
}

function buildSlotOptions(
  meeting: Meeting,
  formatDate: (iso: string) => string,
  formatTime: (iso: string) => string,
  rankLabel: (rank: number) => string,
  customLabel: string
): ConfirmationSlotOption[] {
  const options: ConfirmationSlotOption[] = [];

  if (meeting.recommendations.length > 0) {
    for (const [index, rec] of meeting.recommendations.entries()) {
      options.push({
        id: rec.slot.id,
        slotStart: rec.slot.start,
        recommendationIndex: index,
        label: `${rankLabel(index + 1)} · ${formatDate(rec.slot.start)} ${formatTime(rec.slot.start)}`,
      });
    }
  } else {
    const seen = new Set<string>();
    for (const slot of meeting.candidateSlots) {
      const key = format(parseISO(slot.start), "yyyy-MM-dd HH:mm");
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({
        id: slot.id,
        slotStart: slot.start,
        label: `${formatDate(slot.start)} ${formatTime(slot.start)}`,
      });
      if (options.length >= 12) break;
    }
  }

  options.push({
    id: CUSTOM_SLOT_ID,
    slotStart: "",
    label: customLabel,
  });

  return options;
}

function defaultCustomDate(meeting: Meeting): string {
  return (
    meeting.recommendations[0]?.slot.date ??
    meeting.candidateDateRange.start ??
    format(new Date(), "yyyy-MM-dd")
  );
}

function defaultCustomTime(meeting: Meeting): string {
  if (meeting.recommendations[0]?.slot.start) {
    return format(parseISO(meeting.recommendations[0].slot.start), "HH:mm");
  }
  return "10:00";
}

export function ConfirmationRequestModal({
  open,
  onOpenChange,
  meeting,
  attendeeName,
  defaultRecommendationIndex = null,
  onSubmit,
}: ConfirmationRequestModalProps) {
  const { t, formatDate, formatTime } = useI18n();
  const slotOptions = useMemo(
    () =>
      buildSlotOptions(
        meeting,
        formatDate,
        formatTime,
        (rank) => t.confirmationRequestModal.rank(rank),
        t.confirmationRequestModal.customSchedule
      ),
    [meeting, formatDate, formatTime, t]
  );

  const [slotId, setSlotId] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [preset, setPreset] =
    useState<ConfirmationMessagePreset>("checkAttendance");
  const [messageDraft, setMessageDraft] = useState("");

  // Reset only when the dialog opens — not when options recompute while open
  useEffect(() => {
    if (!open) return;
    const preferred =
      defaultRecommendationIndex != null
        ? slotOptions.find(
            (option) => option.recommendationIndex === defaultRecommendationIndex
          )
        : undefined;
    setSlotId(preferred?.id ?? slotOptions[0]?.id ?? CUSTOM_SLOT_ID);
    setCustomDate(defaultCustomDate(meeting));
    setCustomTime(defaultCustomTime(meeting));
    setPreset("checkAttendance");
    setMessageDraft(t.confirmationRequestModal.presets.checkAttendance);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only on open
  }, [open]);

  const handlePresetChange = (value: ConfirmationMessagePreset) => {
    setPreset(value);
    if (value === "custom") {
      setMessageDraft("");
      return;
    }
    setMessageDraft(t.confirmationRequestModal.presets[value]);
  };

  const isCustomSchedule = slotId === CUSTOM_SLOT_ID;

  const resolvedSlotStart = useMemo(() => {
    if (!isCustomSchedule) {
      return slotOptions.find((item) => item.id === slotId)?.slotStart ?? "";
    }
    if (!customDate || !customTime) return "";
    return parseISO(`${customDate}T${customTime}:00`).toISOString();
  }, [isCustomSchedule, slotOptions, slotId, customDate, customTime]);

  const resolvedMessage = messageDraft.trim();

  const canSubmit =
    Boolean(resolvedSlotStart) &&
    resolvedMessage.length > 0 &&
    (!isCustomSchedule || (Boolean(customDate) && Boolean(customTime)));

  const handleSubmit = () => {
    if (!canSubmit || !resolvedSlotStart) return;
    const option = slotOptions.find((item) => item.id === slotId);
    onSubmit({
      slotStart: resolvedSlotStart,
      message: resolvedMessage,
      recommendationIndex: isCustomSchedule
        ? undefined
        : option?.recommendationIndex,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.confirmationRequestModal.title}</DialogTitle>
          <DialogDescription>
            {t.confirmationRequestModal.description(attendeeName, meeting.title)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="confirm-slot">
              {t.confirmationRequestModal.dateLabel}
            </Label>
            <Select value={slotId} onValueChange={setSlotId}>
              <SelectTrigger id="confirm-slot">
                <SelectValue
                  placeholder={t.confirmationRequestModal.datePlaceholder}
                />
              </SelectTrigger>
              <SelectContent>
                {slotOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isCustomSchedule && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                <p className="text-xs text-muted-foreground">
                  {t.confirmationRequestModal.customScheduleHint}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-custom-date">
                      {t.confirmationRequestModal.customDate}
                    </Label>
                    <Input
                      id="confirm-custom-date"
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-custom-time">
                      {t.confirmationRequestModal.customTime}
                    </Label>
                    <Input
                      id="confirm-custom-time"
                      type="time"
                      step={300}
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-message-preset">
              {t.confirmationRequestModal.messageLabel}
            </Label>
            <Select
              value={preset}
              onValueChange={(value) =>
                handlePresetChange(value as ConfirmationMessagePreset)
              }
            >
              <SelectTrigger id="confirm-message-preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_PRESETS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t.confirmationRequestModal.presetLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              id="confirm-message"
              placeholder={t.confirmationRequestModal.customPlaceholder}
              value={messageDraft}
              onChange={(e) => setMessageDraft(e.target.value)}
              rows={3}
              className="bg-background"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {t.confirmationRequestModal.send}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
