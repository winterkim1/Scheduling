"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import type { TimeSlot } from "@/types";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot?: TimeSlot;
  meetingTitle: string;
  preferredNotCount: number;
  onConfirm: () => void;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  slot,
  meetingTitle,
  preferredNotCount,
  onConfirm,
}: ConfirmationDialogProps) {
  const { t, formatDateTime } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.confirmation.title}</DialogTitle>
          <DialogDescription>
            {preferredNotCount > 0
              ? t.confirmation.confirmWithPreferredNot
              : t.confirmation.confirmWithBroadcast}
          </DialogDescription>
        </DialogHeader>

        {slot && (
          <div className="py-4 px-4 rounded-lg bg-muted">
            <p className="font-semibold">{meetingTitle}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDateTime(slot.start)}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={onConfirm}>{t.confirmation.confirmMeeting}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
