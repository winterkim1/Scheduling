import { parseISO } from "date-fns";
import type { Meeting, PreferredTimeBand, TimeSlot } from "@/types";

export const PREFERRED_TIME_BANDS: PreferredTimeBand[] = [
  "morning",
  "afternoon",
  "evening",
];

/** Classify a slot by local start hour: morning <12, afternoon <18, else evening. */
export function getSlotTimeBand(slotStart: string): PreferredTimeBand {
  const hour = parseISO(slotStart).getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function getUserPreferredTimeBands(
  prefsByUser: Meeting["preferredTimeBandsByUser"] | undefined,
  userId: string
): PreferredTimeBand[] {
  return prefsByUser?.[userId] ?? [];
}

/** Count participants who set a preference and whose bands include this slot. */
export function countPreferredTimeBandMatches(
  meeting: Meeting,
  slot: TimeSlot
): number {
  const band = getSlotTimeBand(slot.start);
  const prefs = meeting.preferredTimeBandsByUser ?? {};
  let matches = 0;
  for (const bands of Object.values(prefs)) {
    if (!bands || bands.length === 0) continue;
    if (bands.includes(band)) matches += 1;
  }
  return matches;
}

/**
 * Share of preference-setters who included each band.
 * Multi-select allowed, so percents can sum above 100.
 */
export function getPreferredTimeBandPercents(
  meeting: Meeting
): Record<PreferredTimeBand, number> {
  const prefs = Object.values(meeting.preferredTimeBandsByUser ?? {}).filter(
    (bands) => bands.length > 0
  );
  const empty = { morning: 0, afternoon: 0, evening: 0 } as Record<
    PreferredTimeBand,
    number
  >;
  if (prefs.length === 0) return empty;

  const counts: Record<PreferredTimeBand, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
  };
  for (const bands of prefs) {
    for (const band of bands) {
      counts[band] += 1;
    }
  }

  return {
    morning: Math.round((counts.morning / prefs.length) * 100),
    afternoon: Math.round((counts.afternoon / prefs.length) * 100),
    evening: Math.round((counts.evening / prefs.length) * 100),
  };
}

export function togglePreferredTimeBand(
  current: PreferredTimeBand[],
  band: PreferredTimeBand
): PreferredTimeBand[] {
  if (current.includes(band)) {
    return current.filter((item) => item !== band);
  }
  return PREFERRED_TIME_BANDS.filter(
    (item) => item === band || current.includes(item)
  );
}
