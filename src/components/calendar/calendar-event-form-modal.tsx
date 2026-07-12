"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CalendarEvent, CalendarEventCategory } from "@/types";
import { useI18n } from "@/lib/i18n";

export type CalendarEventFormValues = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: CalendarEventCategory;
};

interface CalendarEventFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  /** Remount/hydrate key when switching create/edit targets */
  formKey?: string;
  initial?: Partial<CalendarEventFormValues>;
  lockCategory?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CalendarEventFormValues) => void;
}

function defaultsFromEvent(event?: CalendarEvent): CalendarEventFormValues {
  if (!event) {
    return {
      title: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "10:00",
      endTime: "11:00",
      category: "personal",
    };
  }
  return {
    title: event.title,
    date: format(parseISO(event.start), "yyyy-MM-dd"),
    startTime: format(parseISO(event.start), "HH:mm"),
    endTime: format(parseISO(event.end), "HH:mm"),
    category: event.category,
  };
}

export function CalendarEventFormModal({
  open,
  mode,
  formKey,
  initial,
  lockCategory = false,
  onOpenChange,
  onSubmit,
}: CalendarEventFormModalProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [category, setCategory] = useState<CalendarEventCategory>("personal");

  useEffect(() => {
    if (!open) return;
    const next = {
      ...defaultsFromEvent(),
      ...initial,
    };
    setTitle(next.title ?? "");
    setDate(next.date ?? format(new Date(), "yyyy-MM-dd"));
    setStartTime(next.startTime ?? "10:00");
    setEndTime(next.endTime ?? "11:00");
    setCategory(next.category ?? "personal");
    // Hydrate only when dialog opens or target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, formKey]);

  const canSubmit =
    title.trim().length > 0 &&
    Boolean(date && startTime && endTime) &&
    startTime < endTime;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t.calendar.eventFormCreateTitle
              : t.calendar.eventFormEditTitle}
          </DialogTitle>
          <DialogDescription>
            {t.calendar.eventFormDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-2">
            <Label htmlFor="cal-event-title">{t.calendar.eventTitle}</Label>
            <Input
              id="cal-event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.calendar.eventTitlePlaceholder}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cal-event-date">{t.calendar.eventDate}</Label>
            <Input
              id="cal-event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cal-event-start">{t.calendar.eventStart}</Label>
              <Input
                id="cal-event-start"
                type="time"
                step={300}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal-event-end">{t.calendar.eventEnd}</Label>
              <Input
                id="cal-event-end"
                type="time"
                step={300}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cal-event-category">{t.calendar.eventCategory}</Label>
            <Select
              value={category}
              onValueChange={(value) =>
                setCategory(value as CalendarEventCategory)
              }
              disabled={lockCategory}
            >
              <SelectTrigger id="cal-event-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">
                  {t.calendar.categoryPersonal}
                </SelectItem>
                <SelectItem value="team">{t.calendar.categoryTeam}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit) return;
              onSubmit({
                title: title.trim(),
                date,
                startTime,
                endTime,
                category,
              });
              onOpenChange(false);
            }}
          >
            {mode === "create" ? t.calendar.eventSave : t.calendar.eventUpdate}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function eventToFormValues(event: CalendarEvent): CalendarEventFormValues {
  return defaultsFromEvent(event);
}
