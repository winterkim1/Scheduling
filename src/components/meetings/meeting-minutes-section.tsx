"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { AppLink } from "@/components/app-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getMeetingMinutes,
  type MeetingMinutes,
} from "@/lib/meeting-minutes";
import { staticHref } from "@/lib/navigation";
import { useI18n } from "@/lib/i18n";

interface MeetingMinutesSectionProps {
  meetingId: string;
  canWrite?: boolean;
}

function MinutesFields({ minutes }: { minutes: MeetingMinutes }) {
  const { t } = useI18n();
  const fields = [
    { label: t.meetingRecord.agenda, value: minutes.agenda },
    { label: t.meetingRecord.discussion, value: minutes.discussion },
    { label: t.meetingRecord.actionItems, value: minutes.actionItems },
    { label: t.meetingRecord.notes, value: minutes.notes },
  ].filter((field) => field.value.trim());

  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t.meetingRecord.emptyBody}</p>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.label}>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {field.label}
          </p>
          <p className="text-sm whitespace-pre-wrap">{field.value}</p>
        </div>
      ))}
    </div>
  );
}

export function MeetingMinutesSection({
  meetingId,
  canWrite = true,
}: MeetingMinutesSectionProps) {
  const { t } = useI18n();
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMinutes(getMeetingMinutes(meetingId));
  }, [meetingId]);

  const recordHref = staticHref(`/meetings/record/?meetingId=${meetingId}`);

  return (
    <>
      <Card className="mb-6" id="meeting-minutes">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t.meetingRecord.bodyTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {minutes ? (
            <>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {minutes.agenda ||
                  minutes.discussion ||
                  t.meetingRecord.hasMinutesHint}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
                  {t.meetingRecord.viewMinutes}
                </Button>
                {canWrite && (
                  <AppLink href={recordHref} className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto">
                      {t.meetingRecord.editMinutes}
                    </Button>
                  </AppLink>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {t.meetingRecord.noMinutesYet}
              </p>
              {canWrite && (
                <AppLink href={recordHref}>
                  <Button className="w-full sm:w-auto">
                    {t.meetingRecord.writeMinutes}
                  </Button>
                </AppLink>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.meetingRecord.viewMinutesTitle}</DialogTitle>
          </DialogHeader>
          {minutes && <MinutesFields minutes={minutes} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
