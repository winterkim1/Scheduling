import { parseISO } from "date-fns";
import type {
  Meeting,
  Recommendation,
  AvailabilityEntry,
  Attendee,
} from "@/types";
import type { ko } from "./i18n/ko";

type Translations = typeof ko;

function getSlotAvailability(
  availability: AvailabilityEntry[],
  slotId: string
) {
  return availability.filter((a) => a.slotId === slotId);
}

function isUnavailableForSlot(
  slotAvailability: AvailabilityEntry[],
  userId: string
) {
  const entry = slotAvailability.find((a) => a.userId === userId);
  return entry?.state === "unavailable";
}

function isAvailableForSlot(
  slotAvailability: AvailabilityEntry[],
  userId: string
) {
  return !isUnavailableForSlot(slotAvailability, userId);
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

    const requiredUnavailable = required.some((att) =>
      isUnavailableForSlot(slotAvailability, att.userId)
    );

    if (requiredUnavailable) continue;

    const requiredAvailable = required.filter((att) =>
      isAvailableForSlot(slotAvailability, att.userId)
    ).length;

    const optionalAvailable = optionalParticipantIds.filter((userId) =>
      isAvailableForSlot(slotAvailability, userId)
    ).length;

    const preferredNotEntries = slotAvailability.filter(
      (a) => a.state === "preferred_not"
    );
    const preferredNotCount = preferredNotEntries.length;
    const preferredNotUserIds = preferredNotEntries.map((a) => a.userId);

    const unavailableOptional = optionalParticipantIds.filter((userId) =>
      isUnavailableForSlot(slotAvailability, userId)
    ).length;

    const unavailableRequired = required.filter((att) =>
      isUnavailableForSlot(slotAvailability, att.userId)
    ).length;

    scored.push({
      slot,
      requiredAttendance: requiredAvailable,
      requiredTotal: required.length,
      optionalAttendance: optionalAvailable,
      optionalTotal: optionalParticipantIds.length,
      preferredNotCount,
      unavailableCount: unavailableRequired + unavailableOptional,
      unavailableOptionalCount: unavailableOptional,
      overallAttendance: requiredAvailable + optionalAvailable,
      totalAttendees: attendees.length + 1,
      preferredNotUserIds,
      rank: 0,
    });
  }

  scored.sort((a, b) => {
    if (b.requiredAttendance !== a.requiredAttendance)
      return b.requiredAttendance - a.requiredAttendance;
    if (b.optionalAttendance !== a.optionalAttendance)
      return b.optionalAttendance - a.optionalAttendance;
    if (a.preferredNotCount !== b.preferredNotCount)
      return a.preferredNotCount - b.preferredNotCount;
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
} {
  if (rec.requiredAttendance === rec.requiredTotal) {
    return { label: t.recommendation.bestMatch, variant: "success" };
  }
  return { label: t.recommendation.goodMatch, variant: "default" };
}

export type SlotAttendeeInfo = {
  userId: string;
  name: string;
  isRequired: boolean;
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

  const participants = [
    { userId: meeting.organizerId, isRequired: false },
    ...meeting.attendees.map((attendee) => ({
      userId: attendee.userId,
      isRequired: attendee.isRequired,
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
    };

    if (state === "unavailable") {
      unavailable.push(info);
    } else {
      available.push(info);
    }
  }

  return { available, unavailable, preferredNot: [] };
}
