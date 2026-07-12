import { addDays, format, parseISO } from "date-fns";
import type { CalendarEvent, CalendarEventCategory, TimeSlot } from "@/types";
import type { Locale } from "@/lib/i18n/types";
import { CURRENT_USER_ID } from "@/lib/mock-data";

type DemoEventSeed = {
  id: string;
  userId: string;
  category: CalendarEventCategory;
  dayOffset: number;
  startTime: string;
  endTime: string;
  title: Record<Locale, string>;
};

const DEMO_EVENT_SEEDS: DemoEventSeed[] = [
  {
    id: "cal-personal-hospital",
    userId: CURRENT_USER_ID,
    category: "personal",
    dayOffset: 1,
    startTime: "10:00",
    endTime: "11:00",
    title: { ko: "병원 예약", en: "Doctor appointment" },
  },
  {
    id: "cal-team-standup",
    userId: CURRENT_USER_ID,
    category: "team",
    dayOffset: 2,
    startTime: "14:00",
    endTime: "15:00",
    title: { ko: "팀 스탠드업", en: "Team standup" },
  },
  {
    id: "cal-personal-errand",
    userId: CURRENT_USER_ID,
    category: "personal",
    dayOffset: 3,
    startTime: "09:00",
    endTime: "10:00",
    title: { ko: "외부 미팅", en: "External meeting" },
  },
  {
    id: "cal-team-sync-user2",
    userId: "user-2",
    category: "team",
    dayOffset: 1,
    startTime: "11:00",
    endTime: "12:00",
    title: { ko: "프로덕트 싱크", en: "Product sync" },
  },
  {
    id: "cal-personal-user2",
    userId: "user-2",
    category: "personal",
    dayOffset: 2,
    startTime: "15:00",
    endTime: "16:00",
    title: { ko: "개인 일정", en: "Personal appointment" },
  },
  {
    id: "cal-team-user3",
    userId: "user-3",
    category: "team",
    dayOffset: 1,
    startTime: "13:00",
    endTime: "14:00",
    title: { ko: "엔지니어링 리뷰", en: "Engineering review" },
  },
];

function toLocalIso(date: string, time: string): string {
  return parseISO(`${date}T${time}:00`).toISOString();
}

export function getDemoCalendarEvents(locale: Locale = "ko"): CalendarEvent[] {
  const today = new Date();
  return DEMO_EVENT_SEEDS.map((seed) => {
    const date = format(addDays(today, seed.dayOffset), "yyyy-MM-dd");
    return {
      id: seed.id,
      userId: seed.userId,
      title: seed.title[locale],
      start: toLocalIso(date, seed.startTime),
      end: toLocalIso(date, seed.endTime),
      category: seed.category,
    };
  });
}

export function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = parseISO(startA).getTime();
  const aEnd = parseISO(endA).getTime();
  const bStart = parseISO(startB).getTime();
  const bEnd = parseISO(endB).getTime();
  return aStart < bEnd && bStart < aEnd;
}

export function getUserCalendarEvents(
  events: CalendarEvent[],
  userId: string,
  categories?: CalendarEventCategory[]
): CalendarEvent[] {
  return events.filter((event) => {
    if (event.userId !== userId) return false;
    if (!categories || categories.length === 0) return true;
    return categories.includes(event.category);
  });
}

/** First overlapping event title per slot (personal + team). */
export function buildCalendarConflictMap(
  slots: TimeSlot[],
  events: CalendarEvent[],
  userId: string
): Record<string, string> {
  const userEvents = getUserCalendarEvents(events, userId);
  const map: Record<string, string> = {};

  for (const slot of slots) {
    const hit = userEvents.find((event) =>
      rangesOverlap(slot.start, slot.end, event.start, event.end)
    );
    if (hit) {
      map[slot.id] = hit.title;
    }
  }

  return map;
}
