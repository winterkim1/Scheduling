"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChangeRequestReason } from "@/types";
import type { ChangeReasonKey } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n";

const CHANGE_REASONS: ChangeReasonKey[] = [
  "business_meeting",
  "customer_meeting",
  "vacation",
  "emergency",
  "other",
];

interface AvailabilityResubmitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingTitle: string;
  onSubmit: (reason: ChangeRequestReason, note?: string) => void;
}

export function AvailabilityResubmitModal({
  open,
  onOpenChange,
  meetingTitle,
  onSubmit,
}: AvailabilityResubmitModalProps) {
  const { t } = useI18n();
  const [reason, setReason] = useState<ChangeRequestReason>("other");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    onSubmit(reason, note || undefined);
    setReason("other");
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.availabilityResubmit.title}</DialogTitle>
          <DialogDescription>
            {t.availabilityResubmit.description(meetingTitle)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="resubmit-reason">{t.changeModal.reason}</Label>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as ChangeRequestReason)}
            >
              <SelectTrigger id="resubmit-reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANGE_REASONS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t.changeReason[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resubmit-note">{t.changeModal.notes}</Label>
            <Textarea
              id="resubmit-note"
              placeholder={t.availabilityResubmit.notesPlaceholder}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit}>{t.availabilityResubmit.continue}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
