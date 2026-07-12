"use client";

import { motion } from "framer-motion";
import { Check, X, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import type { Meeting } from "@/types";

interface ConfirmationRequestProps {
  meeting: Meeting;
  userId: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function ConfirmationRequest({
  meeting,
  userId,
  onAccept,
  onDecline,
}: ConfirmationRequestProps) {
  const { t, formatDateTime } = useI18n();
  const attendee = meeting.attendees.find((a) => a.userId === userId);
  if (attendee?.confirmationStatus !== "pending") return null;

  const rec = meeting.recommendations[meeting.selectedRecommendationIndex ?? 0];
  if (!rec) return null;

  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10 mb-6">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{t.confirmation.requestTitle}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t.confirmation.requestBody}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-background mb-4">
            <p className="font-medium">{meeting.title}</p>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(rec.slot.start)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" variant="success" onClick={onAccept}>
              <Check className="h-4 w-4" />
              {t.confirmation.accept}
            </Button>
            <Button className="flex-1" variant="outline" onClick={onDecline}>
              <X className="h-4 w-4" />
              {t.confirmation.decline}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
