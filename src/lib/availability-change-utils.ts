import { format, parseISO } from "date-fns";
import type { AvailabilityEntry, TimeSlot } from "@/types";
import type { Translations } from "@/lib/i18n/translations";
import type { Locale } from "@/lib/i18n/types";
import { enUS, ko } from "date-fns/locale";

const dateLocales = { ko, en: enUS };

export function getUserAvailabilityEntries(
  availability: AvailabilityEntry[],
  userId: string
): AvailabilityEntry[] {
  return availability.filter((entry) => entry.userId === userId);
}

function formatSlotLabel(slot: TimeSlot | undefined, locale: Locale): string {
  if (!slot) return "";
  const parsed = parseISO(slot.start);
  const pattern = locale === "ko" ? "M/d(EEE) HH:mm" : "M/d (EEE) HH:mm";
  return format(parsed, pattern, { locale: dateLocales[locale] });
}

function getStateLabel(
  state: AvailabilityEntry["state"] | undefined,
  t: Translations
): string {
  if (!state) return t.availabilityChange.unset;
  return t.availability[state === "preferred_not" ? "preferredNot" : state];
}

export function summarizeAvailabilityChanges(
  previous: AvailabilityEntry[],
  current: AvailabilityEntry[],
  slots: TimeSlot[],
  locale: Locale,
  t: Translations
): string {
  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
  const previousBySlot = new Map(previous.map((entry) => [entry.slotId, entry.state]));
  const currentBySlot = new Map(current.map((entry) => [entry.slotId, entry.state]));
  const slotIds = new Set([...previousBySlot.keys(), ...currentBySlot.keys()]);
  const changes: string[] = [];

  for (const slotId of slotIds) {
    const before = previousBySlot.get(slotId);
    const after = currentBySlot.get(slotId);
    if (before === after) continue;

    const slotLabel = formatSlotLabel(slotMap.get(slotId), locale);
    changes.push(
      t.availabilityChange.slotChange(
        slotLabel,
        getStateLabel(before, t),
        getStateLabel(after, t)
      )
    );
  }

  if (changes.length === 0) {
    return t.availabilityChange.noSlotChanges;
  }

  return changes.join(locale === "ko" ? " · " : " · ");
}
