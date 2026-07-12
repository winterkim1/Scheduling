"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  explainRecommendation,
  getRecommendationBadge,
  type SlotAttendeeGroups,
} from "@/lib/matching-engine";
import { useI18n } from "@/lib/i18n";
import type { Recommendation } from "@/types";
import { cn } from "@/lib/utils";

interface RecommendationCardProps {
  recommendation: Recommendation;
  selected?: boolean;
  expanded?: boolean;
  attendeeGroups?: SlotAttendeeGroups;
  onToggleExpand?: () => void;
  onSelect?: () => void;
}

function AttendeeGroupList({
  label,
  people,
  tone,
}: {
  label: string;
  people: { userId: string; label: string }[];
  tone: "available" | "unavailable" | "preferred";
}) {
  const { t } = useI18n();
  const toneClass =
    tone === "available"
      ? "text-green-700 dark:text-green-400"
      : tone === "unavailable"
        ? "text-red-600 dark:text-red-400"
        : "text-yellow-700 dark:text-yellow-400";

  return (
    <div>
      <p className={cn("text-xs font-semibold mb-1", toneClass)}>{label}</p>
      {people.length > 0 ? (
        <ul className="space-y-0.5">
          {people.map((person) => (
            <li key={person.userId} className="text-sm text-foreground">
              {person.label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t.recommendation.slotEmpty}</p>
      )}
    </div>
  );
}

export function RecommendationCard({
  recommendation,
  selected,
  expanded,
  attendeeGroups,
  onToggleExpand,
  onSelect,
}: RecommendationCardProps) {
  const { t, formatDate, formatTime } = useI18n();
  const badge = getRecommendationBadge(recommendation, t);
  const reasons = explainRecommendation(recommendation, t);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: recommendation.rank * 0.1 }}
    >
      <Card
        className={cn(
          "transition-all",
          selected && "ring-2 ring-primary shadow-md",
          expanded && "ring-2 ring-[#1A1A1A] shadow-md",
          onToggleExpand && "hover:shadow-md cursor-pointer"
        )}
        onClick={onToggleExpand}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {recommendation.rank}
              </span>
              <Badge
                variant={
                  badge.variant === "success"
                    ? "success"
                    : badge.variant === "warning"
                      ? "warning"
                      : "info"
                }
              >
                {badge.label}
              </Badge>
            </div>
            {selected && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {formatDate(recommendation.slot.start)}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatTime(recommendation.slot.start)} – {formatTime(recommendation.slot.end)}
            </div>
          </div>

          <div className="space-y-2">
            {reasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>

          {expanded && attendeeGroups && (
            <div
              className="mt-4 space-y-3 rounded-lg border bg-muted/30 p-3"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <AttendeeGroupList
                label={t.recommendation.slotAvailable}
                people={attendeeGroups.available.map((person) => ({
                  userId: person.userId,
                  label: person.isRequired
                    ? `${person.name} (${t.participant.required})`
                    : person.name,
                }))}
                tone="available"
              />
              <AttendeeGroupList
                label={t.recommendation.slotUnavailable}
                people={attendeeGroups.unavailable.map((person) => ({
                  userId: person.userId,
                  label: person.isRequired
                    ? `${person.name} (${t.participant.required})`
                    : person.name,
                }))}
                tone="unavailable"
              />
            </div>
          )}

          {onSelect && (
            <Button
              className="w-full mt-4"
              variant={selected ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              {selected ? t.recommendation.selected : t.recommendation.selectTime}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
