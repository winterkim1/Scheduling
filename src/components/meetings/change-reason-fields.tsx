"use client";

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
import type { ChangeRequestReason } from "@/types";
import type { ChangeReasonKey } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n";

export const CHANGE_REASONS: ChangeReasonKey[] = [
  "business_meeting",
  "customer_meeting",
  "vacation",
  "emergency",
  "other",
  "custom",
];

export function OptionalFieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: string;
}) {
  const { t } = useI18n();
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <span className="font-normal text-muted-foreground">
        {t.changeModal.optionalSuffix}
      </span>
    </Label>
  );
}

interface ChangeReasonFieldsProps {
  reasonId: string;
  noteId: string;
  customId: string;
  reason: ChangeRequestReason;
  onReasonChange: (reason: ChangeRequestReason) => void;
  customText: string;
  onCustomTextChange: (value: string) => void;
  note: string;
  onNoteChange: (value: string) => void;
  notePlaceholder: string;
}

export function ChangeReasonFields({
  reasonId,
  noteId,
  customId,
  reason,
  onReasonChange,
  customText,
  onCustomTextChange,
  note,
  onNoteChange,
  notePlaceholder,
}: ChangeReasonFieldsProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={reasonId}>{t.changeModal.reason}</Label>
        <Select
          value={reason}
          onValueChange={(value) =>
            onReasonChange(value as ChangeRequestReason)
          }
        >
          <SelectTrigger id={reasonId}>
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

      {reason === "custom" && (
        <div className="space-y-2">
          <Label htmlFor={customId}>{t.changeModal.customReason}</Label>
          <Input
            id={customId}
            value={customText}
            onChange={(event) => onCustomTextChange(event.target.value)}
            placeholder={t.changeModal.customReasonPlaceholder}
          />
        </div>
      )}

      <div className="space-y-2">
        <OptionalFieldLabel htmlFor={noteId}>
          {t.changeModal.notes}
        </OptionalFieldLabel>
        <Textarea
          id={noteId}
          placeholder={notePlaceholder}
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
        />
      </div>
    </div>
  );
}

export function buildChangeReasonNote(
  reason: ChangeRequestReason,
  customText: string,
  note: string
): string | undefined {
  const details = note.trim();
  if (reason === "custom") {
    const custom = customText.trim();
    if (custom && details) return `${custom} — ${details}`;
    return custom || details || undefined;
  }
  return details || undefined;
}

export function canSubmitChangeReason(
  reason: ChangeRequestReason,
  customText: string
): boolean {
  if (reason !== "custom") return true;
  return customText.trim().length > 0;
}

export function formatChangeReasonDisplay(
  reason: ChangeRequestReason,
  note: string | undefined,
  labels: Record<ChangeReasonKey, string>
): string {
  if (reason === "custom") {
    return note?.trim() || labels.custom;
  }
  return note?.trim() ? `${labels[reason]} — ${note}` : labels[reason];
}
