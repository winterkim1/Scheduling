"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
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

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: recommendation.rank * 0.1 }}
    >
      <Card
        className={cn(onToggleExpand && "hover:bg-muted/20 cursor-pointer")}
        onClick={onToggleExpand}
      >
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {recommendation.rank}
            </span>
            {badge && (
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
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-sm sm:text-base">
            <div className="flex items-center gap-2 font-semibold">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
              {formatDate(recommendation.slot.start)}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              {formatTime(recommendation.slot.start)} –{" "}
              {formatTime(recommendation.slot.end)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600 shrink-0" />
              <span>
                {t.recommendation.reasonRequired(
                  recommendation.requiredAttendance,
                  recommendation.requiredTotal
                )}
              </span>
            </div>
            {recommendation.optionalTotal > 0 && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 shrink-0" />
                <span>
                  {t.recommendation.reasonOptional(
                    recommendation.optionalAttendance,
                    recommendation.optionalTotal
                  )}
                </span>
              </div>
            )}
          </div>

          {expanded && attendeeGroups && (
            <div
              className="mt-4 space-y-3 rounded-lg border bg-muted/30 p-3"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <AttendeeGroupList
                label={t.recommendation.slotAvailable}
                people={[
                  ...attendeeGroups.available,
                  ...attendeeGroups.preferredNot,
                ].map((person) => ({
                  userId: person.userId,
                  label: person.isOrganizer
                    ? `${person.name} (${t.organizerDecision.host})`
                    : person.isRequired
                      ? `${person.name} (${t.participant.required})`
                      : `${person.name} (${t.meetings.optionalAttendee})`,
                }))}
                tone="available"
              />
              <AttendeeGroupList
                label={t.recommendation.slotUnavailable}
                people={attendeeGroups.unavailable.map((person) => ({
                  userId: person.userId,
                  label: person.isOrganizer
                    ? `${person.name} (${t.organizerDecision.host})`
                    : person.isRequired
                      ? `${person.name} (${t.participant.required})`
                      : `${person.name} (${t.meetings.optionalAttendee})`,
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
