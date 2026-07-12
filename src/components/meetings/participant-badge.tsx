"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type {
  AttendeeParticipationStatus,
  OrganizerAvailabilityResponse,
} from "@/types";

interface ParticipantBadgeProps {
  name: string;
  jobTitle?: string;
  isRequired?: boolean;
  participationStatus?: AttendeeParticipationStatus;
  availabilityResponse?: OrganizerAvailabilityResponse;
  size?: "sm" | "md";
  className?: string;
}

const statusStyles: Record<AttendeeParticipationStatus, string> = {
  pending: "text-muted-foreground",
  available: "text-green-600 dark:text-green-400",
  unavailable: "text-red-600 dark:text-red-400",
  tentative: "text-orange-600 dark:text-orange-400",
};

const availabilityResponseStyles: Record<OrganizerAvailabilityResponse, string> = {
  no_response: "text-muted-foreground",
  responded: "text-green-600 dark:text-green-400",
};

export function ParticipantBadge({
  name,
  jobTitle,
  isRequired = false,
  participationStatus,
  availabilityResponse,
  size = "md",
  className,
}: ParticipantBadgeProps) {
  const { t } = useI18n();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Avatar className={size === "sm" ? "h-7 w-7" : "h-8 w-8"}>
        <AvatarFallback className="text-xs bg-muted">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className={cn("font-medium", size === "sm" ? "text-xs" : "text-sm")}>
          {name}
          {jobTitle && (
            <span
              className={cn(
                "text-muted-foreground font-normal",
                size === "sm" ? "text-[10px]" : "text-xs"
              )}
            >
              {" "}
              {jobTitle}
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {isRequired && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {t.participant.required}
            </Badge>
          )}
          {participationStatus && (
            <span
              className={cn("text-[10px] font-medium", statusStyles[participationStatus])}
            >
              {t.participant[participationStatus]}
            </span>
          )}
          {availabilityResponse && (
            <span
              className={cn(
                "text-[10px] font-medium",
                availabilityResponseStyles[availabilityResponse]
              )}
            >
              {t.participant[availabilityResponse === "no_response" ? "noResponse" : "responded"]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
