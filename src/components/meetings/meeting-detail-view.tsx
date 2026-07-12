"use client";

import { useState } from "react";
import { AppLink } from "@/components/app-link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/meetings/status-badge";
import { MeetingUrgentLabel } from "@/components/meetings/meeting-urgent-label";
import { Timeline } from "@/components/meetings/timeline";
import { ParticipantBadge } from "@/components/meetings/participant-badge";
import { ResponseDeadlineBadge } from "@/components/meetings/response-deadline-badge";
import {
  canEditAvailability,
  canCancelChangeRequest,
  canRequestScheduleChange,
  getAttendeeParticipationStatus,
  getAttendanceStats,
  getOrganizerAvailabilityResponse,
  getResponseStats,
  isPastMeeting,
  isScheduleConfirmed,
  shouldShowResponseDeadline,
  userHasSubmittedAvailability,
} from "@/lib/meeting-utils";
import { getSlotAttendeeGroups } from "@/lib/matching-engine";
import { getMeetingAvailabilityPath } from "@/lib/meeting-routes";
import { staticHref, navigateTo } from "@/lib/navigation";
import { useMeetingStoreHydrated } from "@/lib/use-store-hydration";
import { RecommendationCard } from "@/components/meetings/recommendation-card";
import { ConfirmationDialog } from "@/components/meetings/confirmation-dialog";
import { ChangeRequestModal } from "@/components/meetings/change-request-modal";
import { MeetingMinutesSection } from "@/components/meetings/meeting-minutes-section";
import { AvailabilityResubmitModal } from "@/components/meetings/availability-resubmit-modal";
import { useMeetingStore } from "@/store/meeting-store";
import {
  AttendanceProgressPill,
  ResponseProgressPill,
} from "@/components/meetings/response-progress-pill";
import { getUserById, getCurrentUser } from "@/lib/mock-data";
import { formatUserAffiliation } from "@/lib/user-utils";
import { getParticipantCount } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

interface MeetingDetailViewProps {
  id: string;
}

export function MeetingDetailView({ id }: MeetingDetailViewProps) {
  const hydrated = useMeetingStoreHydrated();
  const meeting = useMeetingStore((s) => s.getMeeting(id));
  const selectRecommendation = useMeetingStore((s) => s.selectRecommendation);
  const handleChangeRequest = useMeetingStore((s) => s.handleChangeRequest);
  const requestChange = useMeetingStore((s) => s.requestChange);
  const cancelChangeRequest = useMeetingStore((s) => s.cancelChangeRequest);
  const setPendingAvailabilityResubmit = useMeetingStore(
    (s) => s.setPendingAvailabilityResubmit
  );
  const runMatching = useMeetingStore((s) => s.runMatching);
  const viewingAsUserId = useMeetingStore((s) => s.viewingAsUserId);
  const { locale, t, formatDate, formatTime, formatDuration, formatScheduledDateRange } =
    useI18n();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [expandedRecommendationIndex, setExpandedRecommendationIndex] = useState<
    number | null
  >(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [resubmitOpen, setResubmitOpen] = useState(false);

  if (!hydrated) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading...</div>
    );
  }

  if (!meeting) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{t.meetings.notFound}</p>
        <AppLink href="/meetings" className="text-sm underline mt-2 inline-block">
          {t.meetings.backToList}
        </AppLink>
      </div>
    );
  }

  const handleSelectRecommendation = (index: number) => {
    setSelectedIndex(index);
    setConfirmOpen(true);
  };

  const handleToggleRecommendation = (index: number) => {
    setExpandedRecommendationIndex((prev) => (prev === index ? null : index));
  };

  const getAttendeeName = (userId: string) =>
    getUserById(userId, locale)?.name ?? t.common.unknown;

  const handleConfirm = () => {
    if (selectedIndex === null) return;
    selectRecommendation(id, selectedIndex);
    toast.success(t.toast.meetingConfirmed);
    setConfirmOpen(false);
  };

  const timeSlot = meeting.confirmedSlot;
  const isConfirmed = meeting.status === "confirmed";
  const scheduleConfirmed = isScheduleConfirmed(meeting);
  const meetingTimeLabel = timeSlot
    ? `${formatTime(timeSlot.start)} – ${formatTime(timeSlot.end)}`
    : formatDuration(meeting.duration);
  const dateLabel = isConfirmed ? t.meetings.confirmedDate : t.meetings.scheduledDate;
  const dateValueLabel = isConfirmed
    ? timeSlot
      ? formatDate(timeSlot.start)
      : t.meetings.notSet
    : meeting.candidateDateRange.start && meeting.candidateDateRange.end
      ? formatScheduledDateRange(
          meeting.candidateDateRange.start,
          meeting.candidateDateRange.end
        )
      : timeSlot
        ? formatDate(timeSlot.start)
        : t.meetings.notSet;
  const currentUser = getCurrentUser(locale);
  const organizerAvailabilityResponse = getOrganizerAvailabilityResponse(meeting);
  const currentUserHasSubmittedAvailability = userHasSubmittedAvailability(
    meeting,
    currentUser.id
  );
  const showAvailabilityAction = canEditAvailability(meeting);
  const showRequestChangeAction = canRequestScheduleChange(meeting, viewingAsUserId);
  const showCancelChangeRequestAction = canCancelChangeRequest(
    meeting,
    viewingAsUserId
  );
  const showMatchingReportAction =
    meeting.status === "matching" &&
    !canCancelChangeRequest(meeting, viewingAsUserId) &&
    userHasSubmittedAvailability(meeting, viewingAsUserId);
  const showHeaderAvailabilityAction =
    showAvailabilityAction &&
    !showRequestChangeAction &&
    !showCancelChangeRequestAction &&
    meeting.status !== "matching" &&
    id !== "meeting-1";
  const responseStats = getResponseStats(meeting);
  const attendanceStats = getAttendanceStats(meeting);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <AppLink
        href={staticHref("/meetings")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 min-h-[44px]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.meetings.backToList}
      </AppLink>

      <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={meeting.status} meeting={meeting} />
              <MeetingUrgentLabel priority={meeting.priority} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {meeting.title}
              </h1>
              {shouldShowResponseDeadline(meeting) && (
                <ResponseDeadlineBadge deadline={meeting.responseDeadline} />
              )}
            </div>
            <p className="text-muted-foreground mt-2">{meeting.description}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full sm:w-auto sm:justify-end shrink-0">
            {showCancelChangeRequestAction && (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  cancelChangeRequest(id, viewingAsUserId);
                  toast.success(t.toast.changeRequestCancelled);
                }}
              >
                {t.meetings.cancelChangeRequest}
              </Button>
            )}
            {showRequestChangeAction && (
              <Button className="w-full sm:w-auto" onClick={() => setChangeOpen(true)}>
                {t.meetings.requestChange}
              </Button>
            )}
            {showHeaderAvailabilityAction && (
              <AppLink href={staticHref(getMeetingAvailabilityPath(id))} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  {currentUserHasSubmittedAvailability
                    ? t.meetings.editAvailability
                    : t.meetings.submitAvailability}
                </Button>
              </AppLink>
            )}
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <Timeline currentStatus={meeting.status} />
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t.meetings.meetingTime}</p>
                <p className="font-medium truncate">{meetingTimeLabel}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{dateLabel}</p>
                <p className="font-medium truncate">{dateValueLabel}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t.meetings.location}</p>
                <p className="font-medium truncate">
                  {meeting.location || t.meetings.notSet}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {t.meetings.attendeesLabel}
                </p>
                <p className="font-medium truncate">
                  {getParticipantCount(meeting)}
                  {t.common.people}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {meeting.confirmedSlot && !isPastMeeting(meeting) && (
          <Card className="mb-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-green-800 dark:text-green-400 mb-1">
                {t.meetings.confirmedTime}
              </p>
              <p className="text-lg font-semibold">
                {formatDate(meeting.confirmedSlot.start)}{" "}
                {formatTime(meeting.confirmedSlot.start)}
              </p>
            </CardContent>
          </Card>
        )}

        {isConfirmed && !isPastMeeting(meeting) && (
          <MeetingMinutesSection meetingId={meeting.id} />
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">
                {scheduleConfirmed
                  ? t.meetings.participantsConfirmed
                  : t.meetings.participants}
              </CardTitle>
              {!scheduleConfirmed && (
                <ResponseProgressPill
                  responded={responseStats.responded}
                  total={responseStats.total}
                  allComplete={responseStats.allComplete}
                />
              )}
              {scheduleConfirmed && (
                <AttendanceProgressPill
                  attending={attendanceStats.attending}
                  total={attendanceStats.total}
                  allAttending={attendanceStats.allAttending}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <ParticipantBadge
              name={currentUser.name}
              jobTitle={t.participant.me}
              availabilityResponse={
                scheduleConfirmed ? undefined : organizerAvailabilityResponse
              }
              participationStatus={scheduleConfirmed ? "available" : undefined}
            />
            {meeting.attendees.map((att) => {
              const user = getUserById(att.userId, locale);
              if (!user) return null;
              return (
                <ParticipantBadge
                  key={att.userId}
                  name={user.name}
                  jobTitle={formatUserAffiliation(user)}
                  isRequired={att.isRequired}
                  availabilityResponse={
                    scheduleConfirmed
                      ? undefined
                      : att.hasResponded
                        ? "responded"
                        : "no_response"
                  }
                  participationStatus={
                    scheduleConfirmed
                      ? getAttendeeParticipationStatus(meeting, att)
                      : undefined
                  }
                />
              );
            })}
          </CardContent>
        </Card>

        {isPastMeeting(meeting) && (
          <MeetingMinutesSection meetingId={meeting.id} />
        )}

        {meeting.status === "matching" && (
          <Card className="mb-6">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between md:p-6">
              <div>
                <p className="font-medium">{t.meetings.matchingInProgress}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.meetings.matchingInProgressHint}
                </p>
              </div>
              {showMatchingReportAction && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setResubmitOpen(true)}
                >
                  {t.meetings.reportScheduleChange}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {meeting.status === "matching" &&
          viewingAsUserId === meeting.organizerId &&
          (meeting.availabilityChangeLogs?.length ?? 0) > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">
                  {t.meetings.availabilityChangeLogsTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(meeting.availabilityChangeLogs ?? []).map((log) => {
                  const user = getUserById(log.userId, locale);
                  return (
                    <div key={log.id} className="rounded-lg border p-4">
                      <p className="font-medium">{user?.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t.availabilityChange.reasonLabel}:{" "}
                        {t.changeReason[log.reason]}
                        {log.note && ` — ${log.note}`}
                      </p>
                      <p className="mt-2 text-sm">
                        <span className="font-medium">
                          {t.availabilityChange.changesLabel}:{" "}
                        </span>
                        {log.summary}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

        {meeting.status === "recommendation" && meeting.recommendations.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {t.meetings.meetingTimeCandidates}
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {meeting.recommendations.map((rec, i) => (
                <RecommendationCard
                  key={rec.slot.id}
                  recommendation={rec}
                  expanded={expandedRecommendationIndex === i}
                  attendeeGroups={getSlotAttendeeGroups(
                    meeting,
                    rec.slot.id,
                    getAttendeeName
                  )}
                  onToggleExpand={() => handleToggleRecommendation(i)}
                  onSelect={() => handleSelectRecommendation(i)}
                />
              ))}
            </div>
          </section>
        )}

        {meeting.status === "change_requested" && (
          <Card className="mb-6 border-destructive/50">
            <CardHeader>
              <CardTitle className="text-base text-destructive">
                {t.meetings.changeRequestsTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {meeting.changeRequests.map((cr) => {
                const user = getUserById(cr.userId, locale);
                return (
                  <div key={cr.id} className="p-4 rounded-lg border">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.changeReason[cr.reason]}
                      {cr.note && ` — ${cr.note}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cr.isRequired
                        ? t.meetings.requiredAttendee
                        : t.meetings.optionalAttendee}
                    </p>
                  </div>
                );
              })}
              <Separator />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    handleChangeRequest(id, "keep");
                    toast.success(t.toast.meetingKept);
                  }}
                >
                  {t.meetings.keepMeeting}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    handleChangeRequest(id, "re_coordinate");
                    toast.info(t.toast.reCoordinationStarted);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  {t.meetings.startReCoordination}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {meeting.status === "re_matching" && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">{t.meetings.reMatchingProgress}</p>
              <Button
                className="mt-4"
                onClick={() => {
                  runMatching(id);
                  toast.success(t.toast.newRecommendations);
                }}
              >
                {t.meetings.viewNewRecommendations}
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        slot={
          selectedIndex !== null
            ? meeting.recommendations[selectedIndex]?.slot
            : undefined
        }
        meetingTitle={meeting.title}
        preferredNotCount={
          selectedIndex !== null
            ? meeting.recommendations[selectedIndex]?.preferredNotCount ?? 0
            : 0
        }
        onConfirm={handleConfirm}
      />

      <ChangeRequestModal
        open={changeOpen}
        onOpenChange={setChangeOpen}
        meetingTitle={meeting.title}
        onSubmit={(reason, note) => {
          requestChange(id, viewingAsUserId, reason, note);
          toast.success(t.toast.changeSubmitted);
        }}
      />

      <AvailabilityResubmitModal
        open={resubmitOpen}
        onOpenChange={setResubmitOpen}
        meetingTitle={meeting.title}
        onSubmit={(reason, note) => {
          setPendingAvailabilityResubmit(id, viewingAsUserId, reason, note);
          navigateTo(getMeetingAvailabilityPath(id));
        }}
      />
    </div>
  );
}
