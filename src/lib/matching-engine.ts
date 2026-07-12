import { parseISO } from "date-fns";
import type {
  Meeting,
  Recommendation,
  AvailabilityEntry,
  Attendee,
} from "@/types";
import type { ko } from "./i18n/ko";
import { countPreferredTimeBandMatches } from "./preferred-time-band";

type Translations = typeof ko;

function getSlotAvailability(
  availability: AvailabilityEntry[],
  slotId: string
) {
  return availability.filter((a) => a.slotId === slotId);
}

function getStateForSlot(
  slotAvailability: AvailabilityEntry[],
  userId: string
): "available" | "preferred_not" | "unavailable" {
  const entry = slotAvailability.find((a) => a.userId === userId);
  return entry?.state ?? "available";
}

function isUnavailableForSlot(
  slotAvailability: AvailabilityEntry[],
  userId: string
) {
  return getStateForSlot(slotAvailability, userId) === "unavailable";
}

function isStrictlyAvailableForSlot(
  slotAvailability: AvailabilityEntry[],
  userId: string
) {
  return getStateForSlot(slotAvailability, userId) === "available";
}

export function scoreRecommendations(meeting: Meeting): Recommendation[] {
  const { candidateSlots, availability, attendees } = meeting;
  const required = attendees.filter((a) => a.isRequired);
  const optionalInvitees = attendees.filter((a) => !a.isRequired);
  const optionalParticipantIds = [
    ...optionalInvitees.map((a) => a.userId),
    meeting.organizerId,
  ];

  const scored: Recommendation[] = [];

  for (const slot of candidateSlots) {
    const slotAvailability = getSlotAvailability(availability, slot.id);

    // 필수 전원 “가능”이어야 후보 (비선호/보류·불가 제외)
    const requiredAvailable = required.filter((att) =>
      isStrictlyAvailableForSlot(slotAvailability, att.userId)
    ).length;
    if (requiredAvailable < required.length) continue;

    const optionalAvailable = optionalParticipantIds.filter((userId) =>
      isStrictlyAvailableForSlot(slotAvailability, userId)
    ).length;

    const preferredNotEntries = slotAvailability.filter(
      (a) => a.state === "preferred_not"
    );
    const preferredNotCount = preferredNotEntries.length;
    const preferredNotUserIds = preferredNotEntries.map((a) => a.userId);

    const unavailableOptional = optionalParticipantIds.filter((userId) =>
      isUnavailableForSlot(slotAvailability, userId)
    ).length;

    scored.push({
      slot,
      requiredAttendance: requiredAvailable,
      requiredTotal: required.length,
      optionalAttendance: optionalAvailable,
      optionalTotal: optionalParticipantIds.length,
      preferredNotCount,
      unavailableCount: unavailableOptional,
      unavailableOptionalCount: unavailableOptional,
      overallAttendance: requiredAvailable + optionalAvailable,
      totalAttendees: attendees.length + 1,
      preferredNotUserIds,
      rank: 0,
    });
  }

  // 필수 전원 가능 전제: 선택 참석 ↓ → 전체 가능 ↓ → 비선호 적음 → 선호 시간대 일치 ↓ → 빠른 시간
  scored.sort((a, b) => {
    if (b.optionalAttendance !== a.optionalAttendance)
      return b.optionalAttendance - a.optionalAttendance;
    if (b.overallAttendance !== a.overallAttendance)
      return b.overallAttendance - a.overallAttendance;
    if (a.preferredNotCount !== b.preferredNotCount)
      return a.preferredNotCount - b.preferredNotCount;
    const preferredA = countPreferredTimeBandMatches(meeting, a.slot);
    const preferredB = countPreferredTimeBandMatches(meeting, b.slot);
    if (preferredB !== preferredA) return preferredB - preferredA;
    return parseISO(a.slot.start).getTime() - parseISO(b.slot.start).getTime();
  });

  return scored;
}

export function pickTopRecommendations(
  scored: Recommendation[],
  count: number
): Recommendation[] {
  return scored.slice(0, count).map((rec, index) => ({ ...rec, rank: index + 1 }));
}

/** @deprecated Use pickTopRecommendations */
export function pickDiverseRecommendations(
  scored: Recommendation[],
  count: number
): Recommendation[] {
  return pickTopRecommendations(scored, count);
}

export function runMatchingEngine(meeting: Meeting): Recommendation[] {
  return pickTopRecommendations(scoreRecommendations(meeting), 3);
}

export function getAvailabilityForUser(
  availability: AvailabilityEntry[],
  userId: string,
  slotId: string
): "available" | "preferred_not" | "unavailable" {
  const entry = availability.find(
    (a) => a.userId === userId && a.slotId === slotId
  );
  return entry?.state ?? "available";
}

export function allRequiredResponded(attendees: Attendee[]): boolean {
  return attendees.filter((a) => a.isRequired).every((a) => a.hasResponded);
}

export function allOptionalResponded(attendees: Attendee[]): boolean {
  return attendees.every((a) => a.hasResponded);
}

export function getResponseProgress(meeting: Meeting): {
  responded: number;
  total: number;
  percentage: number;
} {
  const responded = meeting.attendees.filter((a) => a.hasResponded).length;
  const total = meeting.attendees.length;
  return {
    responded,
    total,
    percentage: total > 0 ? Math.round((responded / total) * 100) : 0,
  };
}

export function explainRecommendation(
  rec: Recommendation,
  t: Translations
): string[] {
  const reasons: string[] = [];
  reasons.push(t.recommendation.reasonRequired(rec.requiredAttendance, rec.requiredTotal));
  if (rec.optionalTotal > 0) {
    reasons.push(t.recommendation.reasonOptional(rec.optionalAttendance, rec.optionalTotal));
  }
  if (rec.unavailableOptionalCount > 0) {
    reasons.push(t.recommendation.reasonUnavailable(rec.unavailableOptionalCount));
  }
  return reasons;
}

export function getRecommendationBadge(
  rec: Recommendation,
  t: Translations
): {
  label: string;
  variant: "success" | "warning" | "default";
} | null {
  // "최적" is reserved for the top-ranked recommendation only
  if (rec.rank !== 1) return null;
  return { label: t.recommendation.bestMatch, variant: "success" };
}

export type SlotAttendeeInfo = {
  userId: string;
  name: string;
  isRequired: boolean;
  isOrganizer?: boolean;
};

export type SlotAttendeeGroups = {
  available: SlotAttendeeInfo[];
  unavailable: SlotAttendeeInfo[];
  preferredNot: SlotAttendeeInfo[];
};

export function getSlotAttendeeGroups(
  meeting: Meeting,
  slotId: string,
  getName: (userId: string) => string
): SlotAttendeeGroups {
  const available: SlotAttendeeInfo[] = [];
  const unavailable: SlotAttendeeInfo[] = [];
  const preferredNot: SlotAttendeeInfo[] = [];

  const participants = [
    { userId: meeting.organizerId, isRequired: false, isOrganizer: true },
    ...meeting.attendees.map((attendee) => ({
      userId: attendee.userId,
      isRequired: attendee.isRequired,
      isOrganizer: false,
    })),
  ];

  for (const participant of participants) {
    const state = getAvailabilityForUser(
      meeting.availability,
      participant.userId,
      slotId
    );
    const info: SlotAttendeeInfo = {
      userId: participant.userId,
      name: getName(participant.userId),
      isRequired: participant.isRequired,
      isOrganizer: participant.isOrganizer,
    };

    if (state === "unavailable") {
      unavailable.push(info);
    } else if (state === "preferred_not") {
      preferredNot.push(info);
    } else {
      available.push(info);
    }
  }

  return { available, unavailable, preferredNot };
}

export type OrganizerRosterState =
  | "available"
  | "preferred_not"
  | "unavailable"
  | "pending";

export type OrganizerRosterPerson = {
  userId: string;
  name: string;
  isRequired: boolean;
  isOrganizer: boolean;
  isMe: boolean;
  state: OrganizerRosterState;
  /** confirm = 비선호 확인, adjust = 불가 일정 조정, nudge = 미응답 */
  action: "none" | "confirm" | "adjust" | "nudge";
};

function hasRespondedForMeeting(meeting: Meeting, userId: string): boolean {
  if (userId === meeting.organizerId) {
    return meeting.organizerHasResponded === true;
  }
  return (
    meeting.attendees.find((attendee) => attendee.userId === userId)
      ?.hasResponded === true
  );
}

/** Host-facing per-person readout for a slot — UI interprets the grid. */
export function getOrganizerSlotRoster(
  meeting: Meeting,
  slotId: string,
  viewingAsUserId: string,
  getName: (userId: string) => string
): OrganizerRosterPerson[] {
  const participants = [
    {
      userId: meeting.organizerId,
      isRequired: false,
      isOrganizer: true,
    },
    ...meeting.attendees.map((attendee) => ({
      userId: attendee.userId,
      isRequired: attendee.isRequired,
      isOrganizer: false,
    })),
  ];

  return participants.map((participant) => {
    const responded = hasRespondedForMeeting(meeting, participant.userId);
    const availabilityState = getAvailabilityForUser(
      meeting.availability,
      participant.userId,
      slotId
    );

    let state: OrganizerRosterState;
    let action: OrganizerRosterPerson["action"] = "none";

    if (!responded) {
      state = "pending";
      action = "nudge";
    } else if (availabilityState === "preferred_not") {
      state = "preferred_not";
      action = "confirm";
    } else if (availabilityState === "unavailable") {
      state = "unavailable";
      action = "adjust";
    } else {
      state = "available";
    }

    return {
      userId: participant.userId,
      name: getName(participant.userId),
      isRequired: participant.isRequired,
      isOrganizer: participant.isOrganizer,
      isMe: participant.userId === viewingAsUserId,
      state,
      action,
    };
  });
}

export function isConfirmableRecommendation(rec: Recommendation): boolean {
  return (
    rec.requiredAttendance === rec.requiredTotal && rec.preferredNotCount === 0
  );
}

export function hasConfirmableRecommendation(
  recommendations: Recommendation[]
): boolean {
  return recommendations.some(isConfirmableRecommendation);
}
