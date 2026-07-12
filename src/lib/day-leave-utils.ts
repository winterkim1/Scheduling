import { format, parseISO } from "date-fns";
import type {
  AvailabilityEntry,
  AvailabilityState,
  DayLeavePreset,
  Meeting,
  TimeSlot,
} from "@/types";

const MORNING_HALF_END_MINUTES = 13 * 60 + 30;
const AFTERNOON_HALF_START_MINUTES = 14 * 60;

function slotStartMinutes(slot: TimeSlot): number {
  const [hours, minutes] = format(parseISO(slot.start), "HH:mm")
    .split(":")
    .map(Number);
  return hours * 60 + minutes;
}

export function slotMatchesLeavePreset(
  slot: TimeSlot,
  preset: DayLeavePreset
): boolean {
  if (preset === "none") return false;

  const startMinutes = slotStartMinutes(slot);

  if (preset === "full_day") return true;
  if (preset === "morning_half") return startMinutes <= MORNING_HALF_END_MINUTES;
  if (preset === "afternoon_half") return startMinutes >= AFTERNOON_HALF_START_MINUTES;
  return false;
}

export function applyDayLeavePresetToAvailability(
  availability: AvailabilityEntry[],
  slots: TimeSlot[],
  userId: string,
  date: string,
  preset: DayLeavePreset
): AvailabilityEntry[] {
  let next = [...availability];
  const dateSlots = slots.filter((slot) => slot.date === date);

  for (const slot of dateSlots) {
    const state: AvailabilityState = slotMatchesLeavePreset(slot, preset)
      ? "unavailable"
      : "available";
    next = upsertUserSlotAvailability(next, userId, slot.id, state);
  }

  return next;
}

export function upsertUserSlotAvailability(
  availability: AvailabilityEntry[],
  userId: string,
  slotId: string,
  state: AvailabilityState
): AvailabilityEntry[] {
  const next = [...availability];
  const index = next.findIndex(
    (entry) => entry.userId === userId && entry.slotId === slotId
  );

  if (index >= 0) {
    next[index] = { userId, slotId, state };
  } else {
    next.push({ userId, slotId, state });
  }

  return next;
}

export function getUserDayLeavePreset(
  presetsByUser: Meeting["dayLeavePresetsByUser"] | undefined,
  userId: string,
  date: string
): DayLeavePreset | undefined {
  const preset = presetsByUser?.[userId]?.[date];
  return preset && preset !== "none" ? preset : undefined;
}
