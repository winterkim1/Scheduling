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

interface ChangeRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingTitle: string;
  onSubmit: (reason: ChangeRequestReason, note?: string) => void;
}

export function ChangeRequestModal({
  open,
  onOpenChange,
  meetingTitle,
  onSubmit,
}: ChangeRequestModalProps) {
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
          <DialogTitle>{t.changeModal.title}</DialogTitle>
          <DialogDescription>{t.changeModal.description(meetingTitle)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reason">{t.changeModal.reason}</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as ChangeRequestReason)}
            >
              <SelectTrigger id="reason">
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
            <Label htmlFor="note">{t.changeModal.notes}</Label>
            <Textarea
              id="note"
              placeholder={t.changeModal.notesPlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit}>{t.changeModal.submit}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
