import { isBefore, parseISO, startOfDay } from "date-fns";
import type { Attendee, AttendeeParticipationStatus, ChangeRequest, Meeting, OrganizerAvailabilityResponse } from "@/types";
import { getParticipantCount } from "@/lib/utils";

export function getMeetingEventDate(meeting: Meeting): Date | null {
  if (meeting.confirmedSlot?.start) {
    return parseISO(meeting.confirmedSlot.start);
  }
  return null;
}

export function isPastMeeting(meeting: Meeting): boolean {
  const date = getMeetingEventDate(meeting);
  if (!date || meeting.status !== "confirmed") return false;
  return isBefore(date, startOfDay(new Date()));
}

export function isUpcomingConfirmed(meeting: Meeting): boolean {
  return meeting.status === "confirmed" && !isPastMeeting(meeting);
}

export function isUpcomingMeeting(meeting: Meeting): boolean {
  return isUpcomingConfirmed(meeting);
}

export function getAttendeeParticipationStatus(
  meeting: Meeting,
  attendee: Attendee
): AttendeeParticipationStatus {
  if (!attendee.hasResponded) return "pending";

  if (attendee.confirmationStatus === "declined") return "unavailable";
  if (attendee.confirmationStatus === "accepted") return "available";
  if (attendee.participationStatus) return attendee.participationStatus;

  const userAvailability = meeting.availability.filter(
    (entry) => entry.userId === attendee.userId
  );

  if (userAvailability.length === 0) return "available";

  const states = userAvailability.map((entry) => entry.state);
  if (states.every((state) => state === "unavailable")) return "unavailable";
  if (states.some((state) => state === "available")) return "available";
  if (states.some((state) => state === "preferred_not")) return "tentative";

  return "available";
}

export function getOrganizerAvailabilityResponse(
  meeting: Meeting
): OrganizerAvailabilityResponse {
  return meeting.organizerHasResponded ? "responded" : "no_response";
}

export function isActiveMeeting(meeting: Meeting): boolean {
  return !["confirmed", "draft"].includes(meeting.status);
}

export function isScheduleConfirmed(meeting: Meeting): boolean {
  return meeting.status === "confirmed" || meeting.status === "change_requested";
}

const AVAILABILITY_EDIT_STATUSES = [
  "availability_collection",
  "matching",
  "recommendation",
  "re_matching",
] as const;

export function canEditAvailability(meeting: Meeting): boolean {
  if (isScheduleConfirmed(meeting)) return false;
  return AVAILABILITY_EDIT_STATUSES.includes(
    meeting.status as (typeof AVAILABILITY_EDIT_STATUSES)[number]
  );
}

export function userHasSubmittedAvailability(
  meeting: Meeting,
  userId: string
): boolean {
  if (userId === meeting.organizerId) return meeting.organizerHasResponded ?? false;
  return (
    meeting.attendees.find((attendee) => attendee.userId === userId)
      ?.hasResponded ?? false
  );
}

export function shouldShowResponseDeadline(meeting: Meeting): boolean {
  if (!meeting.responseDeadline) return false;
  if (meeting.status === "confirmed" || meeting.status === "draft") return false;
  return true;
}

export function isMeetingAttendee(meeting: Meeting, userId: string): boolean {
  return meeting.attendees.some((attendee) => attendee.userId === userId);
}

export function getUserChangeRequest(
  meeting: Meeting,
  userId: string
): ChangeRequest | undefined {
  return meeting.changeRequests.find((request) => request.userId === userId);
}

export function canRequestScheduleChange(
  meeting: Meeting,
  userId: string
): boolean {
  if (userId === meeting.organizerId) return false;
  if (!isMeetingAttendee(meeting, userId)) return false;
  if (getUserChangeRequest(meeting, userId)) return false;
  return (
    meeting.status === "confirmed" ||
    meeting.status === "change_requested" ||
    meeting.status === "matching"
  );
}

export function canCancelChangeRequest(meeting: Meeting, userId: string): boolean {
  return Boolean(getUserChangeRequest(meeting, userId));
}

export function isAttendingStatus(status: AttendeeParticipationStatus): boolean {
  return status === "available";
}

export function getResponseStats(meeting: Meeting): {
  responded: number;
  total: number;
  allComplete: boolean;
} {
  const responded =
    meeting.attendees.filter((attendee) => attendee.hasResponded).length +
    (meeting.organizerHasResponded ? 1 : 0);
  const total = getParticipantCount(meeting);

  return {
    responded,
    total,
    allComplete: responded === total,
  };
}

export function getAttendanceStats(meeting: Meeting): {
  attending: number;
  total: number;
  allAttending: boolean;
} {
  const total = getParticipantCount(meeting);
  let attending = 1;

  for (const attendee of meeting.attendees) {
    if (isAttendingStatus(getAttendeeParticipationStatus(meeting, attendee))) {
      attending++;
    }
  }

  return {
    attending,
    total,
    allAttending: attending === total,
  };
}
