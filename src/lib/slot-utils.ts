import { addDays, addMinutes, setHours, setMinutes, format, parseISO } from "date-fns";
import type { AvailabilityEntry, TimeSlot } from "@/types";
import { MEETING_1_FEATURED_SLOT } from "./demo-data";

const WORK_DAY_START_MINUTES = 9 * 60;
const LUNCH_START_MINUTES = 12 * 60;
const LUNCH_END_MINUTES = 13 * 60;
const WORK_DAY_END_MINUTES = 18 * 60;

/** Slot starts step by meeting duration within morning / afternoon work blocks. */
export function generateSlotStartMinutes(duration: number): number[] {
  const step = Math.max(15, duration);
  const starts: number[] = [];

  const pushRange = (rangeStart: number, rangeEnd: number) => {
    for (let m = rangeStart; m + duration <= rangeEnd; m += step) {
      starts.push(m);
    }
  };

  pushRange(WORK_DAY_START_MINUTES, LUNCH_START_MINUTES);
  pushRange(LUNCH_END_MINUTES, WORK_DAY_END_MINUTES);

  return starts;
}

export function generateCandidateSlots(
  startDate: string,
  endDate: string,
  duration: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const startMinutes = generateSlotStartMinutes(duration);

  let current = start;
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      for (const minutes of startMinutes) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const slotStart = setMinutes(setHours(current, hour), minute);
        const slotEnd = addMinutes(slotStart, duration);
        slots.push({
          id: `slot-${format(slotStart, "yyyy-MM-dd-HH-mm")}`,
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          date: format(slotStart, "yyyy-MM-dd"),
        });
      }
    }
    current = addDays(current, 1);
  }
  return slots;
}

function slotStartTime(slot: TimeSlot): string {
  return format(parseISO(slot.start), "HH:mm");
}

function findSlotByDateAndTime(
  slots: TimeSlot[],
  date: string,
  time: string
): string | undefined {
  return slots.find((slot) => slot.date === date && slotStartTime(slot) === time)?.id;
}

export function remapPlaceholderAvailability(
  availability: AvailabilityEntry[],
  slots: TimeSlot[]
): AvailabilityEntry[] {
  if (availability.length === 0 || slots.length === 0) return availability;

  const usesNumberedPlaceholders = availability.some((entry) =>
    /^slot-\d+$/.test(entry.slotId)
  );

  if (!usesNumberedPlaceholders) {
    return availability.map((entry, index) => ({
      ...entry,
      slotId: slots[index % slots.length]?.id ?? entry.slotId,
    }));
  }

  const firstDate = slots[0].date;
  const secondDate = slots.find((slot) => slot.date !== firstDate)?.date ?? firstDate;
  const placeholderMap: Record<string, string | undefined> = {
    "slot-1": findSlotByDateAndTime(slots, firstDate, slotStartTime(slots[0])) ?? slots[0]?.id,
    "slot-2": findSlotByDateAndTime(slots, firstDate, "13:00"),
    "slot-3":
      findSlotByDateAndTime(
        slots,
        MEETING_1_FEATURED_SLOT.date,
        MEETING_1_FEATURED_SLOT.time
      ) ?? findSlotByDateAndTime(slots, secondDate, "10:00"),
  };

  return availability.map((entry) => ({
    ...entry,
    slotId: placeholderMap[entry.slotId] ?? entry.slotId,
  }));
}

export function groupSlotsByDate(slots: TimeSlot[]): Record<string, TimeSlot[]> {
  return slots.reduce(
    (acc, slot) => {
      if (!acc[slot.date]) acc[slot.date] = [];
      acc[slot.date].push(slot);
      return acc;
    },
    {} as Record<string, TimeSlot[]>
  );
}

export function cycleAvailabilityState(
  current: "available" | "preferred_not" | "unavailable"
): "available" | "preferred_not" | "unavailable" {
  const cycle: ("available" | "preferred_not" | "unavailable")[] = [
    "available",
    "preferred_not",
    "unavailable",
  ];
  const idx = cycle.indexOf(current);
  return cycle[(idx + 1) % cycle.length];
}
