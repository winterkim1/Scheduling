"use client";

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { motion } from "framer-motion";
import { enUS, ko } from "date-fns/locale";
import {
  addDays,
  endOfDay,
  format,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMeetingStore } from "@/store/meeting-store";
import type { MeetingPriority } from "@/types";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { getMeetingDetailPath } from "@/lib/meeting-routes";
import { navigateTo } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  AttendeePicker,
  draftsToAttendeeIds,
  hasUnassignedAttendeeRoles,
  type AttendeeDraft,
} from "@/components/meetings/attendee-picker";
import {
  PastPeriodPicker,
  formatPastPeriodLabel,
  type DateRange,
} from "@/components/meetings/past-period-picker";

const DURATION_OPTIONS = [30, 45, 60, 90, 120];
const DURATION_CUSTOM = "custom";
const PRIORITY_OPTIONS: MeetingPriority[] = ["none", "urgent"];

function responseDeadlineFromEnd(endDate: string): string {
  if (!endDate) return "";
  return format(subDays(parseISO(endDate), 7), "yyyy-MM-dd");
}

function resolveDurationMinutes(
  durationSelect: string,
  customDuration: string
): number | null {
  if (durationSelect === DURATION_CUSTOM) {
    const parsed = parseInt(customDuration, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  const parsed = parseInt(durationSelect, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function defaultScheduledRange(): DateRange {
  const start = startOfDay(new Date());
  const end = endOfDay(addDays(start, 7));
  return { start, end };
}

export type CreateMeetingFormHandle = {
  saveDraft: () => void;
};

export const CreateMeetingForm = forwardRef<CreateMeetingFormHandle>(
  function CreateMeetingForm(_props, ref) {
    const createMeeting = useMeetingStore((s) => s.createMeeting);
    const sendInvitations = useMeetingStore((s) => s.sendInvitations);
    const { locale, t, formatDuration } = useI18n();
    const dateLocale = locale === "ko" ? ko : enUS;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [durationSelect, setDurationSelect] = useState("60");
    const [customDuration, setCustomDuration] = useState("");
    const [priority, setPriority] = useState<MeetingPriority>("none");
    const [scheduledRange, setScheduledRange] = useState<DateRange>(
      defaultScheduledRange
    );
    const [scheduledPickerOpen, setScheduledPickerOpen] = useState(false);
    const [deadline, setDeadline] = useState(() =>
      responseDeadlineFromEnd(
        format(defaultScheduledRange().end, "yyyy-MM-dd")
      )
    );
    const [attendeeDrafts, setAttendeeDrafts] = useState<AttendeeDraft[]>([]);

    const hasAttendees = attendeeDrafts.length > 0;
    const scheduledLabel = useMemo(
      () => formatPastPeriodLabel(scheduledRange, locale, dateLocale),
      [scheduledRange, locale, dateLocale]
    );

    const buildMeeting = (mode: "submit" | "draft") => {
      if (!title.trim()) {
        toast.error(t.createForm.errorTitle);
        return null;
      }

      const durationMinutes = resolveDurationMinutes(
        durationSelect,
        customDuration
      );
      if (durationMinutes === null) {
        toast.error(t.createForm.errorDuration);
        return null;
      }

      if (hasAttendees) {
        if (hasUnassignedAttendeeRoles(attendeeDrafts)) {
          toast.error(t.createForm.errorAttendeeRole);
          return null;
        }

        if (mode === "submit") {
          const { requiredAttendeeIds } = draftsToAttendeeIds(attendeeDrafts);
          if (requiredAttendeeIds.length === 0) {
            toast.error(t.createForm.errorAttendees);
            return null;
          }
        }
      }

      const { requiredAttendeeIds, optionalAttendeeIds } =
        draftsToAttendeeIds(attendeeDrafts);

      return createMeeting({
        title,
        description,
        location,
        duration: durationMinutes,
        candidateDateRange: {
          start: format(scheduledRange.start, "yyyy-MM-dd"),
          end: format(scheduledRange.end, "yyyy-MM-dd"),
        },
        responseDeadline: deadline,
        priority,
        requiredAttendeeIds,
        optionalAttendeeIds,
      });
    };

    const handleSubmit = () => {
      const meeting = buildMeeting("submit");
      if (!meeting) return;

      if (hasAttendees) {
        sendInvitations(meeting.id);
        toast.success(t.createForm.successInvite);
      } else {
        toast.success(t.createForm.successCreate);
      }

      navigateTo(getMeetingDetailPath(meeting.id));
    };

    const handleSaveDraft = () => {
      const meeting = buildMeeting("draft");
      if (!meeting) return;

      toast.success(t.createForm.successDraft);
      navigateTo("/meetings/?tab=drafts");
    };

    useImperativeHandle(ref, () => ({
      saveDraft: handleSaveDraft,
    }));

    return (
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>{t.createForm.details}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 min-w-0 overflow-visible">
            <div className="space-y-2">
              <Label htmlFor="title">{t.createForm.title}</Label>
              <Input
                id="title"
                placeholder={t.createForm.titlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t.createForm.description}</Label>
              <Textarea
                id="description"
                placeholder={t.createForm.descriptionPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{t.createForm.location}</Label>
              <Input
                id="location"
                placeholder={t.createForm.locationPlaceholder}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 min-w-0 sm:grid-cols-2">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="duration">{t.createForm.durationMinutes}</Label>
                <Select value={durationSelect} onValueChange={setDurationSelect}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((mins) => (
                      <SelectItem key={mins} value={String(mins)}>
                        {formatDuration(mins)}
                      </SelectItem>
                    ))}
                    <SelectItem value={DURATION_CUSTOM}>
                      {t.createForm.durationCustom}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {durationSelect === DURATION_CUSTOM && (
                  <Input
                    id="duration-custom"
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    placeholder="60"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2 min-w-0">
                <Label htmlFor="priority">{t.createForm.priority}</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as MeetingPriority)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {t.priority[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 min-w-0 sm:grid-cols-2">
              <div className="relative space-y-2 min-w-0">
                <Label htmlFor="scheduledDate" className="block leading-snug">
                  {t.createForm.scheduledDate}
                </Label>
                <button
                  type="button"
                  id="scheduledDate"
                  onClick={() => setScheduledPickerOpen((open) => !open)}
                  aria-expanded={scheduledPickerOpen}
                  aria-label={t.createForm.selectScheduledDate}
                  className={cn(
                    "flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm",
                    "text-left hover:bg-accent/40 transition-colors",
                    scheduledPickerOpen && "ring-2 ring-ring ring-offset-2"
                  )}
                >
                  <span className="truncate">{scheduledLabel}</span>
                </button>
                <p className="text-xs text-muted-foreground">
                  {t.createForm.scheduledDateHint}
                </p>
                <PastPeriodPicker
                  open={scheduledPickerOpen}
                  bound="future"
                  range={scheduledRange}
                  onOpenChange={setScheduledPickerOpen}
                  onChange={(next) => {
                    setScheduledRange(next);
                    setDeadline(
                      responseDeadlineFromEnd(format(next.end, "yyyy-MM-dd"))
                    );
                  }}
                  title={t.createForm.selectScheduledDate}
                  hint={t.createForm.scheduledDateHint}
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="deadline" className="block leading-snug">
                  {t.createForm.deadline}
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  className="w-full"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <AttendeePicker
          drafts={attendeeDrafts}
          onChange={setAttendeeDrafts}
          locale={locale}
        />

        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-4 z-10">
          <Button className="w-full h-12 text-base" size="lg" onClick={handleSubmit}>
            {hasAttendees ? t.createForm.submitInvite : t.createForm.submitCreate}
          </Button>
        </div>
      </motion.div>
    );
  }
);
