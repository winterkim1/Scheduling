import { addDays, format, parseISO } from "date-fns";
import type { AvailabilityEntry, Meeting, Notification, Recommendation, TimeSlot } from "@/types";
import { CURRENT_USER_ID } from "./mock-data";
import type { Locale } from "./i18n/types";
import {
  pickTopRecommendations,
  scoreRecommendations,
} from "./matching-engine";

const meetingContent: Record<
  Locale,
  Record<
    string,
    { title: string; description: string; location: string; changeNote?: string }
  >
> = {
  ko: {
    "meeting-1": {
      title: "Q3 제품 전략 리뷰",
      description:
        "분기별 제품 로드맵, 핵심 지표, Q3 전략 우선순위를 검토합니다.",
      location: "온라인(zoom)",
    },
    "meeting-2": {
      title: "엔지니어링 스프린트 계획",
      description:
        "스프린트 목표 수립, 업무 배정, 백로그 우선순위를 검토합니다.",
      location: "본관 2층 회의실 B",
    },
    "meeting-3": {
      title: "고객 온보딩 킥오프",
      description: "신규 엔터프라이즈 고객과의 첫 킥오프 미팅입니다.",
      location: "고객센터 1층 라운지",
    },
    "meeting-4": {
      title: "디자인 시스템 워크숍",
      description: "디자인 시스템 업데이트에 대해 함께 논의하는 워크숍입니다.",
      location: "별관 4층 크리에이티브룸",
      changeNote: "같은 시간에 긴급 고객 미팅이 잡혔습니다.",
    },
    "meeting-5": {
      title: "주간 운영 리뷰",
      description: "주간 핵심 지표와 운영 이슈를 점검합니다.",
      location: "본관 3층 회의실 C",
    },
    "meeting-6": {
      title: "분기별 전략 워크숍",
      description: "지난 분기 성과를 복기하고 다음 분기 방향을 논의합니다.",
      location: "별관 2층 세미나실",
    },
    "meeting-7": {
      title: "마케팅 캠페인 킥오프",
      description:
        "하반기 마케팅 캠페인 목표, 채널 전략, 예산 배분을 논의합니다.",
      location: "본관 4층 회의실 D",
    },
  },
  en: {
    "meeting-1": {
      title: "Q3 Product Strategy Review",
      description:
        "Review quarterly product roadmap, key metrics, and Q3 strategic priorities.",
      location: "Online (Zoom)",
    },
    "meeting-2": {
      title: "Engineering Sprint Planning",
      description:
        "Set sprint goals, assign tasks, and prioritize the backlog.",
      location: "Building A, Room 201",
    },
    "meeting-3": {
      title: "Client Onboarding Kickoff",
      description: "First kickoff meeting with a new enterprise client.",
      location: "Customer Center, 1F Lounge",
    },
    "meeting-4": {
      title: "Design System Workshop",
      description: "Collaborative workshop on design system updates.",
      location: "Building B, Creative Room 4F",
      changeNote: "An urgent client meeting was scheduled at the same time.",
    },
    "meeting-5": {
      title: "Weekly Operations Review",
      description: "Review weekly KPIs and operational issues.",
      location: "Building A, Room 303",
    },
    "meeting-6": {
      title: "Quarterly Strategy Workshop",
      description: "Retrospective on last quarter and planning for the next.",
      location: "Building B, Seminar Room 2F",
    },
    "meeting-7": {
      title: "Marketing Campaign Kickoff",
      description:
        "Discuss H2 campaign goals, channel strategy, and budget allocation.",
      location: "Building A, Room 401",
    },
  },
};

const ALL_INVITEE_IDS = ["user-2", "user-3", "user-4", "user-5", "user-6"] as const;

export const MEETING_1_CANDIDATE_DATE_RANGE = {
  start: "2026-07-13",
  end: "2026-07-17",
} as const;

export const MEETING_1_RESPONSE_DEADLINE = "2026-07-10T11:00:00";
export const MEETING_2_RESPONSE_DEADLINE = "2026-07-10T10:00:00";

export const MEETING_1_FEATURED_SLOT = {
  date: "2026-07-13",
  time: "10:00",
} as const;

/** 엔진 점수와 동일하게 나오도록: 필수 전원 가능 슬롯은 이 3개만 둔다. */
const MEETING_1_RANK_SLOTS = [
  // 1순위: 선택 전원 가능
  { date: "2026-07-13", time: "10:00", unavailableOptional: [] as const },
  // 2순위: 선택 2/3 — 한소희(user-6) 불가
  {
    date: "2026-07-14",
    time: "10:00",
    unavailableOptional: ["user-6"] as const,
  },
  // 3순위: 선택 1/3 — 한소희·정태영 불가
  {
    date: "2026-07-15",
    time: "13:00",
    unavailableOptional: ["user-5", "user-6"] as const,
  },
] as const;

const MEETING_1_REQUIRED_IDS = ["user-2", "user-3", "user-4"] as const;
const MEETING_1_OPTIONAL_IDS = ["user-5", "user-6"] as const;

/** 표 색 다양화용 — 필수 불가/선택 전원 불가만 (1~3순위와 점수 경쟁하지 않음) */
type Meeting1FillPattern =
  | { tone: "red" }
  | { tone: "white"; unavailableRequired: readonly string[] };

const MEETING_1_FILL_PATTERNS: Meeting1FillPattern[] = [
  { tone: "red" },
  { tone: "white", unavailableRequired: ["user-2"] },
  { tone: "white", unavailableRequired: ["user-3", "user-4"] },
  { tone: "red" },
  { tone: "white", unavailableRequired: ["user-2", "user-3"] },
  { tone: "white", unavailableRequired: ["user-4"] },
  { tone: "red" },
  { tone: "white", unavailableRequired: ["user-2"] },
];

export function seedMeeting1RecommendationAvailability(
  _availability: AvailabilityEntry[],
  slots: TimeSlot[]
): AvailabilityEntry[] {
  const findSlot = (date: string, time: string) =>
    slots.find(
      (item) =>
        item.date === date && format(parseISO(item.start), "HH:mm") === time
    );

  const rankSlotIds = new Set<string>();
  const unavailableBySlot = new Map<string, ReadonlySet<string>>();

  for (const seed of MEETING_1_RANK_SLOTS) {
    const slot = findSlot(seed.date, seed.time);
    if (!slot) continue;
    rankSlotIds.add(slot.id);
    unavailableBySlot.set(slot.id, new Set(seed.unavailableOptional));
  }

  const optionalParticipants = [
    ...MEETING_1_OPTIONAL_IDS,
    CURRENT_USER_ID,
  ] as const;
  const participants = [
    ...MEETING_1_REQUIRED_IDS,
    ...optionalParticipants,
  ];

  const nonRankSlots = slots.filter((slot) => !rankSlotIds.has(slot.id));
  const patternBySlot = new Map<string, Meeting1FillPattern>();
  nonRankSlots.forEach((slot, index) => {
    patternBySlot.set(
      slot.id,
      MEETING_1_FILL_PATTERNS[index % MEETING_1_FILL_PATTERNS.length]
    );
  });

  const result: AvailabilityEntry[] = [];
  for (const slot of slots) {
    const isRankSlot = rankSlotIds.has(slot.id);
    const rankUnavailable = unavailableBySlot.get(slot.id);
    const pattern = patternBySlot.get(slot.id);

    for (const userId of participants) {
      let state: AvailabilityEntry["state"] = "available";

      if (isRankSlot) {
        if (rankUnavailable?.has(userId)) state = "unavailable";
      } else if (pattern) {
        if (pattern.tone === "red") {
          if (optionalParticipants.includes(userId as (typeof optionalParticipants)[number])) {
            state = "unavailable";
          }
        } else if (pattern.tone === "white") {
          if (pattern.unavailableRequired.includes(userId)) {
            state = "unavailable";
          }
        }
      }

      result.push({ userId, slotId: slot.id, state });
    }
  }

  return result;
}

export const MEETING_4_SCHEDULED_DATE = "2026-07-16";

export const MEETING_7_CANDIDATE_DATE_RANGE = {
  start: "2026-07-13",
  end: "2026-07-16",
} as const;

export const MEETING_7_PREFERRED_NOT_SEEDS = [
  { date: "2026-07-15", time: "13:00", userId: CURRENT_USER_ID },
] as const;

export function seedMeeting7MatchingAvailability(
  availability: AvailabilityEntry[],
  slots: TimeSlot[]
): AvailabilityEntry[] {
  const merged = [...availability];

  for (const seed of MEETING_7_PREFERRED_NOT_SEEDS) {
    const slot = slots.find(
      (item) =>
        item.date === seed.date &&
        format(parseISO(item.start), "HH:mm") === seed.time
    );
    if (!slot) continue;

    const entry = {
      userId: seed.userId,
      slotId: slot.id,
      state: "preferred_not" as const,
    };
    const index = merged.findIndex(
      (item) => item.slotId === slot.id && item.userId === seed.userId
    );

    if (index >= 0) merged[index] = entry;
    else merged.push(entry);
  }

  return merged;
}

function standardAttendees(
  config: Record<
    (typeof ALL_INVITEE_IDS)[number],
    {
      isRequired: boolean;
      hasResponded: boolean;
      participationStatus?: "available" | "unavailable" | "tentative";
    }
  >
) {
  return ALL_INVITEE_IDS.map((userId) => ({
    userId,
    ...config[userId],
  }));
}

export function buildMeeting1Recommendations(meeting: Meeting): Recommendation[] {
  // 시드 가용성과 동일 기준으로 우선순위 산출 → 매칭 결과·후보 목록 일치
  return pickTopRecommendations(scoreRecommendations(meeting), 3);
}

export function getDemoMeetings(locale: Locale): Meeting[] {
  const content = meetingContent[locale];
  return [
    {
      id: "meeting-2",
      title: content["meeting-2"].title,
      description: content["meeting-2"].description,
      location: content["meeting-2"].location,
      duration: 60,
      candidateDateRange: {
        start: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        end: format(addDays(new Date(), 5), "yyyy-MM-dd"),
      },
      responseDeadline: MEETING_2_RESPONSE_DEADLINE,
      priority: "none",
      status: "availability_collection",
      organizerId: CURRENT_USER_ID,
      attendees: standardAttendees({
        "user-2": { isRequired: true, hasResponded: true },
        "user-3": { isRequired: true, hasResponded: true },
        "user-4": { isRequired: false, hasResponded: false },
        "user-5": { isRequired: true, hasResponded: false },
        "user-6": { isRequired: false, hasResponded: false },
      }),
      candidateSlots: [],
      availability: [
        { userId: "user-2", slotId: "slot-a", state: "available" },
        { userId: "user-2", slotId: "slot-b", state: "preferred_not" },
        { userId: "user-3", slotId: "slot-a", state: "available" },
        { userId: "user-3", slotId: "slot-b", state: "available" },
      ],
      recommendations: [],
      manualCoordinationMode: false,
      createdAt: format(addDays(new Date(), -1), "yyyy-MM-dd'T'HH:mm:ss"),
      updatedAt: new Date().toISOString(),
      changeRequests: [],
    },
    {
      id: "meeting-1",
      title: content["meeting-1"].title,
      description: content["meeting-1"].description,
      location: content["meeting-1"].location,
      duration: 60,
      candidateDateRange: {
        start: MEETING_1_CANDIDATE_DATE_RANGE.start,
        end: MEETING_1_CANDIDATE_DATE_RANGE.end,
      },
      responseDeadline: MEETING_1_RESPONSE_DEADLINE,
      priority: "urgent",
      status: "recommendation",
      organizerId: CURRENT_USER_ID,
      organizerHasResponded: true,
      attendees: standardAttendees({
        "user-2": { isRequired: true, hasResponded: true },
        "user-3": { isRequired: true, hasResponded: true },
        "user-4": { isRequired: true, hasResponded: true },
        "user-5": { isRequired: false, hasResponded: true },
        "user-6": { isRequired: false, hasResponded: true },
      }),
      candidateSlots: [],
      availability: [],
      recommendations: [],
      manualCoordinationMode: false,
      createdAt: format(addDays(new Date(), -2), "yyyy-MM-dd'T'HH:mm:ss"),
      updatedAt: new Date().toISOString(),
      changeRequests: [],
    },
    {
      id: "meeting-7",
      title: content["meeting-7"].title,
      description: content["meeting-7"].description,
      location: content["meeting-7"].location,
      duration: 60,
      candidateDateRange: {
        start: MEETING_7_CANDIDATE_DATE_RANGE.start,
        end: MEETING_7_CANDIDATE_DATE_RANGE.end,
      },
      responseDeadline: "2026-07-16",
      priority: "none",
      status: "matching",
      organizerId: CURRENT_USER_ID,
      organizerHasResponded: true,
      attendees: standardAttendees({
        "user-2": { isRequired: true, hasResponded: true },
        "user-3": { isRequired: true, hasResponded: true },
        "user-4": { isRequired: true, hasResponded: true },
        "user-5": { isRequired: false, hasResponded: true },
        "user-6": { isRequired: false, hasResponded: true },
      }),
      candidateSlots: [],
      availability: [],
      recommendations: [],
      manualCoordinationMode: false,
      createdAt: format(addDays(new Date(), -1), "yyyy-MM-dd'T'HH:mm:ss"),
      updatedAt: new Date().toISOString(),
      changeRequests: [],
    },
    {
      id: "meeting-3",
      title: content["meeting-3"].title,
      description: content["meeting-3"].description,
      location: content["meeting-3"].location,
      duration: 90,
      candidateDateRange: {
        start: format(addDays(new Date(), 3), "yyyy-MM-dd"),
        end: format(addDays(new Date(), 10), "yyyy-MM-dd"),
      },
      responseDeadline: format(addDays(new Date(), 5), "yyyy-MM-dd"),
      priority: "none",
      status: "confirmed",
      organizerId: CURRENT_USER_ID,
      organizerHasResponded: true,
      attendees: standardAttendees({
        "user-2": { isRequired: true, hasResponded: true, participationStatus: "available" },
        "user-3": { isRequired: true, hasResponded: true, participationStatus: "available" },
        "user-4": { isRequired: true, hasResponded: true, participationStatus: "available" },
        "user-5": { isRequired: false, hasResponded: true, participationStatus: "available" },
        "user-6": { isRequired: false, hasResponded: true, participationStatus: "unavailable" },
      }),
      candidateSlots: [],
      availability: [],
      recommendations: [],
      confirmedSlot: {
        id: "confirmed-slot",
        start: addDays(new Date(), 5)
          .toISOString()
          .replace(/T.*/, "T14:00:00.000Z"),
        end: addDays(new Date(), 5)
          .toISOString()
          .replace(/T.*/, "T15:30:00.000Z"),
        date: format(addDays(new Date(), 5), "yyyy-MM-dd"),
      },
      manualCoordinationMode: false,
      createdAt: format(addDays(new Date(), -5), "yyyy-MM-dd'T'HH:mm:ss"),
      updatedAt: new Date().toISOString(),
      confirmedAt: format(addDays(new Date(), -1), "yyyy-MM-dd'T'HH:mm:ss"),
      changeRequests: [],
    },
    {
      id: "meeting-4",
      title: content["meeting-4"].title,
      description: content["meeting-4"].description,
      location: content["meeting-4"].location,
      duration: 120,
      candidateDateRange: {
        start: MEETING_4_SCHEDULED_DATE,
        end: MEETING_4_SCHEDULED_DATE,
      },
      responseDeadline: "2026-07-15",
      priority: "none",
      status: "change_requested",
      organizerId: CURRENT_USER_ID,
      attendees: standardAttendees({
        "user-2": { isRequired: true, hasResponded: true },
        "user-3": { isRequired: true, hasResponded: true },
        "user-4": { isRequired: true, hasResponded: true },
        "user-5": { isRequired: false, hasResponded: true },
        "user-6": { isRequired: false, hasResponded: true },
      }),
      candidateSlots: [],
      availability: [],
      recommendations: [],
      confirmedSlot: {
        id: "confirmed-slot-2",
        start: `${MEETING_4_SCHEDULED_DATE}T10:00:00.000Z`,
        end: `${MEETING_4_SCHEDULED_DATE}T12:00:00.000Z`,
        date: MEETING_4_SCHEDULED_DATE,
      },
      manualCoordinationMode: false,
      createdAt: format(addDays(new Date(), -7), "yyyy-MM-dd'T'HH:mm:ss"),
      updatedAt: new Date().toISOString(),
      confirmedAt: format(addDays(new Date(), -3), "yyyy-MM-dd'T'HH:mm:ss"),
      changeRequests: [
        {
          id: "cr-1",
          userId: "user-3",
          reason: "customer_meeting",
          note: content["meeting-4"].changeNote,
          createdAt: new Date().toISOString(),
          isRequired: true,
        },
      ],
    },
    {
      id: "meeting-5",
      title: content["meeting-5"].title,
      description: content["meeting-5"].description,
      location: content["meeting-5"].location,
      duration: 30,
      candidateDateRange: {
        start: format(addDays(new Date(), -21), "yyyy-MM-dd"),
        end: format(addDays(new Date(), -14), "yyyy-MM-dd"),
      },
      responseDeadline: format(addDays(new Date(), -16), "yyyy-MM-dd"),
      priority: "none",
      status: "confirmed",
      organizerId: CURRENT_USER_ID,
      attendees: standardAttendees({
        "user-2": { isRequired: true, hasResponded: true },
        "user-3": { isRequired: true, hasResponded: true },
        "user-4": { isRequired: true, hasResponded: true },
        "user-5": { isRequired: false, hasResponded: true },
        "user-6": { isRequired: false, hasResponded: true },
      }),
      candidateSlots: [],
      availability: [],
      recommendations: [],
      confirmedSlot: {
        id: "confirmed-slot-past-1",
        start: addDays(new Date(), -14)
          .toISOString()
          .replace(/T.*/, "T11:00:00.000Z"),
        end: addDays(new Date(), -14)
          .toISOString()
          .replace(/T.*/, "T11:30:00.000Z"),
        date: format(addDays(new Date(), -14), "yyyy-MM-dd"),
      },
      manualCoordinationMode: false,
      createdAt: format(addDays(new Date(), -20), "yyyy-MM-dd'T'HH:mm:ss"),
      updatedAt: new Date().toISOString(),
      confirmedAt: format(addDays(new Date(), -15), "yyyy-MM-dd'T'HH:mm:ss"),
      changeRequests: [],
    },
    {
      id: "meeting-6",
      title: content["meeting-6"].title,
      description: content["meeting-6"].description,
      location: content["meeting-6"].location,
      duration: 120,
      candidateDateRange: {
        start: format(addDays(new Date(), -60), "yyyy-MM-dd"),
        end: format(addDays(new Date(), -45), "yyyy-MM-dd"),
      },
      responseDeadline: format(addDays(new Date(), -50), "yyyy-MM-dd"),
      priority: "none",
      status: "confirmed",
      organizerId: CURRENT_USER_ID,
      attendees: standardAttendees({
        "user-2": { isRequired: true, hasResponded: true },
        "user-3": { isRequired: true, hasResponded: true },
        "user-4": { isRequired: true, hasResponded: true },
        "user-5": { isRequired: false, hasResponded: true },
        "user-6": { isRequired: false, hasResponded: true },
      }),
      candidateSlots: [],
      availability: [],
      recommendations: [],
      confirmedSlot: {
        id: "confirmed-slot-past-2",
        start: addDays(new Date(), -45)
          .toISOString()
          .replace(/T.*/, "T15:00:00.000Z"),
        end: addDays(new Date(), -45)
          .toISOString()
          .replace(/T.*/, "T17:00:00.000Z"),
        date: format(addDays(new Date(), -45), "yyyy-MM-dd"),
      },
      manualCoordinationMode: false,
      createdAt: format(addDays(new Date(), -55), "yyyy-MM-dd'T'HH:mm:ss"),
      updatedAt: new Date().toISOString(),
      confirmedAt: format(addDays(new Date(), -46), "yyyy-MM-dd'T'HH:mm:ss"),
      changeRequests: [],
    },
  ];
}

export const PREFERRED_SLOT_DEMO_NOTIFICATION_ID =
  "notif-demo-preferred-slot-meeting-7";
export const MEETING_CONFIRMED_DEMO_NOTIFICATION_ID =
  "notif-demo-meeting-confirmed-meeting-3";
export const RESPONSE_PENDING_DEMO_NOTIFICATION_ID =
  "notif-demo-response-pending-meeting-2";

export function mergeDemoNotifications(
  notifications: Notification[],
  locale: Locale,
  dismissedIds: Set<string>
): Notification[] {
  const demoNotifications = getDemoNotifications(locale);
  const demoById = new Map(
    demoNotifications
      .filter((notification) => notification.id.startsWith("notif-demo-"))
      .map((notification) => [notification.id, notification])
  );

  const merged = notifications.map((notification) => {
    const demoNotification = demoById.get(notification.id);
    if (!demoNotification) return notification;
    return {
      ...notification,
      type: demoNotification.type,
      title: demoNotification.title,
      message: demoNotification.message,
      footnote: demoNotification.footnote,
    };
  });

  const existingIds = new Set(merged.map((notification) => notification.id));
  for (const demoNotification of demoNotifications) {
    const isPinned = demoNotification.id === PREFERRED_SLOT_DEMO_NOTIFICATION_ID;
    if (
      !existingIds.has(demoNotification.id) &&
      (isPinned || !dismissedIds.has(demoNotification.id))
    ) {
      merged.unshift(demoNotification);
      existingIds.add(demoNotification.id);
    }
  }

  return merged;
}

export function getDemoNotifications(locale: Locale): Notification[] {
  const m2 = meetingContent[locale]["meeting-2"].title;
  const m1 = meetingContent[locale]["meeting-1"].title;
  const m3 = meetingContent[locale]["meeting-3"].title;
  const m4 = meetingContent[locale]["meeting-4"].title;
  const requester =
    locale === "ko" ? "박준호" : "Marcus Thompson";

  const now = Date.now();
  const mk = (
    type: Notification["type"],
    title: string,
    message: string,
    meetingId?: string,
    offset = 0,
    id?: string,
    footnote?: string
  ): Notification => ({
    id: id ?? `notif-demo-${type}-${offset}`,
    type,
    title,
    message,
    footnote,
    meetingId,
    read: false,
    createdAt: new Date(now - offset).toISOString(),
  });

  if (locale === "ko") {
    return [
      mk(
        "confirmation_required",
        "일정 확인 요청",
        "비선호/보류 시간인 7/15(수) 13:00를 회의 일정 후보로 지정하여도 괜찮을까요?",
        "meeting-7",
        0,
        "notif-demo-preferred-slot-meeting-7",
        "* 12시간 내 미응답 시 가능으로 자동 체크됩니다"
      ),
      mk("invitation", "새 초대", `${m2} 회의에 초대되었습니다`, "meeting-2", 1),
      mk(
        "confirmation_required",
        "참석 확인",
        `${m1} 참석 확인이 필요합니다`,
        "meeting-1",
        2
      ),
      mk(
        "change_request",
        "일정 변경 요청",
        `${requester}님이 ${m4} 일정 변경을 요청했습니다`,
        "meeting-4",
        3
      ),
      mk(
        "meeting_confirmed",
        "일정 확정",
        `"${m3}" 회의 일정이 확정되었습니다.`,
        "meeting-3",
        4,
        MEETING_CONFIRMED_DEMO_NOTIFICATION_ID
      ),
      mk(
        "reminder",
        "응답 대기",
        `"${m2}" 회의의 가능 일시 응답을 기다리고 있습니다.`,
        "meeting-2",
        5,
        RESPONSE_PENDING_DEMO_NOTIFICATION_ID
      ),
    ];
  }

  return [
    mk(
      "confirmation_required",
      "Schedule confirmation request",
      "Would it be okay to designate 7/15 (Wed) 13:00, a preferred-not time, as a meeting candidate?",
      "meeting-7",
      0,
      "notif-demo-preferred-slot-meeting-7",
      "* Will be auto-assigned if no response by 7/14 (Tue) 12:00"
    ),
    mk(
      "invitation",
      "New invitation",
      `You've been invited to ${m2}`,
      "meeting-2",
      1
    ),
    mk(
      "confirmation_required",
      "Attendance confirmation",
      `Your attendance is needed for ${m1}`,
      "meeting-1",
      2
    ),
    mk(
      "change_request",
      "Change request",
      `${requester} requested a schedule change for ${m4}`,
      "meeting-4",
      3
    ),
    mk(
      "meeting_confirmed",
      "Schedule confirmed",
      `"${m3}" has been confirmed.`,
      "meeting-3",
      4,
      MEETING_CONFIRMED_DEMO_NOTIFICATION_ID
    ),
    mk(
      "reminder",
      "Response pending",
      `Waiting for availability responses for "${m2}".`,
      "meeting-2",
      5,
      RESPONSE_PENDING_DEMO_NOTIFICATION_ID
    ),
  ];
}

export function localizeMeetings(
  meetings: Meeting[],
  locale: Locale
): Meeting[] {
  const content = meetingContent[locale];
  return meetings.map((m) => {
    const c = content[m.id];
    if (!c) return m;
    return {
      ...m,
      title: c.title,
      description: c.description,
      location: c.location,
      changeRequests: m.changeRequests.map((cr) =>
        cr.id === "cr-1" && c.changeNote
          ? { ...cr, note: c.changeNote }
          : cr
      ),
    };
  });
}
