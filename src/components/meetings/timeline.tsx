"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { MeetingStatus } from "@/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const LIFECYCLE_STEPS = [
  "availability_collection",
  "matching",
  "recommendation",
  "confirmed",
] as const;

type TimelineStep = (typeof LIFECYCLE_STEPS)[number];

const STEP_INDEX: Record<MeetingStatus, number> = {
  draft: 0,
  invitation_sent: 0,
  availability_collection: 0,
  matching: 1,
  recommendation: 2,
  confirmed: 3,
  pending_confirmation: 3,
  change_requested: 3,
  re_matching: 1,
};

interface TimelineProps {
  currentStatus: MeetingStatus;
  compact?: boolean;
}

export function Timeline({ currentStatus, compact = false }: TimelineProps) {
  const { t } = useI18n();
  const currentIndex = STEP_INDEX[currentStatus];
  const isChangeFlow =
    currentStatus === "change_requested" || currentStatus === "re_matching";

  return (
    <div className={cn("w-full", compact ? "py-2" : "py-4")}>
      {isChangeFlow && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-sm text-yellow-800 dark:text-yellow-400 font-medium">
          {currentStatus === "change_requested"
            ? t.timeline.changeRequested
            : t.timeline.reMatching}
        </div>
      )}

      <div className="relative">
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-border hidden md:block" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-500 hidden md:block"
          style={{
            width: `calc(${(currentIndex / (LIFECYCLE_STEPS.length - 1)) * 100}% - 2rem)`,
          }}
        />

        <div
          className={cn(
            "flex gap-1",
            compact
              ? "overflow-x-auto scrollbar-hide pb-2"
              : "flex-col md:flex-row md:justify-between"
          )}
        >
          {LIFECYCLE_STEPS.map((step: TimelineStep, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;
            const isConfirmedHighlight =
              step === "confirmed" && currentStatus === "confirmed";
            const isChangeRequestedHighlight =
              step === "confirmed" && currentStatus === "change_requested";
            const usesSpecialConfirmedStyle =
              isConfirmedHighlight || isChangeRequestedHighlight;

            return (
              <motion.div
                key={step}
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-2",
                  compact
                    ? "shrink-0"
                    : "md:flex-col md:items-center md:text-center md:flex-1"
                )}
              >
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all shrink-0",
                    isCompleted &&
                      !usesSpecialConfirmedStyle &&
                      "bg-primary border-primary text-primary-foreground",
                    isCurrent &&
                      !usesSpecialConfirmedStyle &&
                      "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
                    isConfirmedHighlight &&
                      "bg-green-600 border-green-600 text-white ring-4 ring-green-600/25 dark:bg-green-500 dark:border-green-500 dark:ring-green-500/30",
                    isChangeRequestedHighlight &&
                      "bg-red-600 border-red-600 text-white ring-4 ring-red-600/25 dark:bg-red-500 dark:border-red-500 dark:ring-red-500/30",
                    isPending &&
                      "bg-background border-border text-muted-foreground"
                  )}
                >
                  {isCompleted || (isCurrent && step === "confirmed") ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isConfirmedHighlight && "text-green-700 dark:text-green-400",
                    isChangeRequestedHighlight &&
                      "text-red-700 dark:text-red-400",
                    isCurrent &&
                      !usesSpecialConfirmedStyle &&
                      "text-foreground",
                    isPending && "text-muted-foreground",
                    isCompleted &&
                      !usesSpecialConfirmedStyle &&
                      "text-foreground",
                    !compact && "md:mt-2"
                  )}
                >
                  {t.status[step]}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
