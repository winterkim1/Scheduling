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
import type { ChangeRequestReason } from "@/types";
import { useI18n } from "@/lib/i18n";
import {
  ChangeReasonFields,
  buildChangeReasonNote,
  canSubmitChangeReason,
} from "@/components/meetings/change-reason-fields";

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
  const [customText, setCustomText] = useState("");
  const [note, setNote] = useState("");

  const reset = () => {
    setReason("other");
    setCustomText("");
    setNote("");
  };

  const handleSubmit = () => {
    if (!canSubmitChangeReason(reason, customText)) return;
    onSubmit(reason, buildChangeReasonNote(reason, customText, note));
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.changeModal.title}</DialogTitle>
          <DialogDescription>
            {t.changeModal.description(meetingTitle)}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <ChangeReasonFields
            reasonId="change-reason"
            noteId="change-note"
            customId="change-custom"
            reason={reason}
            onReasonChange={setReason}
            customText={customText}
            onCustomTextChange={setCustomText}
            note={note}
            onNoteChange={setNote}
            notePlaceholder={t.changeModal.notesPlaceholder}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmitChangeReason(reason, customText)}
          >
            {t.changeModal.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
