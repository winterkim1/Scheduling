"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, FileText, Users, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { MeetingUrgentLabel } from "./meeting-urgent-label";
import { ResponseDeadlineBadge } from "./response-deadline-badge";
import type { Meeting } from "@/types";
import { getResponseStats } from "@/lib/meeting-utils";
import { getParticipantCount } from "@/lib/utils";
import { shouldShowResponseDeadline } from "@/lib/meeting-utils";
import { hasMeetingMinutes } from "@/lib/meeting-minutes";
import { getMeetingDetailPath } from "@/lib/meeting-routes";
import { staticHref } from "@/lib/navigation";
import { useI18n } from "@/lib/i18n";

interface MeetingCardProps {
  meeting: Meeting;
  showProgress?: boolean;
}

export function MeetingCard({ meeting, showProgress = true }: MeetingCardProps) {
  const { locale, t, formatDate, formatTime, formatDuration } = useI18n();
  const [hasMinutes, setHasMinutes] = useState(false);
  const responseStats = getResponseStats(meeting);
  const progressPercentage =
    responseStats.total > 0
      ? Math.round((responseStats.responded / responseStats.total) * 100)
      : 0;
  const confirmedTime = meeting.confirmedSlot;
  const participantCount = getParticipantCount(meeting);

  useEffect(() => {
    setHasMinutes(hasMeetingMinutes(meeting.id));
  }, [meeting.id]);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <a
        href={staticHref(
          meeting.status === "confirmed"
            ? `${getMeetingDetailPath(meeting.id)}#meeting-minutes`
            : getMeetingDetailPath(meeting.id)
        )}
      >
        <Card className="hover:shadow-md transition-shadow cursor-pointer group">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <StatusBadge status={meeting.status} meeting={meeting} />
                  <MeetingUrgentLabel priority={meeting.priority} />
                  {hasMinutes && (
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      {t.meetingRecord.minutesBadge}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-semibold text-base md:text-lg truncate group-hover:text-primary transition-colors min-w-0 flex-1">
                    {meeting.title}
                  </h3>
                  {shouldShowResponseDeadline(meeting) && (
                    <ResponseDeadlineBadge deadline={meeting.responseDeadline} />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {meeting.description}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-muted-foreground">
              {confirmedTime ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(confirmedTime.start)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(confirmedTime.start)}
                  </span>
                </>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(meeting.duration)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {participantCount}
                {locale === "ko" ? t.common.attendees : ` ${t.common.attendees}`}
              </span>
            </div>

            {showProgress && meeting.status === "availability_collection" && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{t.meetings.responses}</span>
                  <span>
                    {responseStats.responded}/{responseStats.total}
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {meeting.changeRequests.length > 0 && (
              <div className="mt-3 text-xs text-destructive font-medium">
                {t.meetings.changeRequestCount(meeting.changeRequests.length)}
              </div>
            )}
          </CardContent>
        </Card>
      </a>
    </motion.div>
  );
}
