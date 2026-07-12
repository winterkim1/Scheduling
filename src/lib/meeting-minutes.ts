export interface MeetingMinutes {
  meetingId: string;
  agenda: string;
  discussion: string;
  actionItems: string;
  notes: string;
  updatedAt: string;
  /** Custom meeting metadata when not linked to a store meeting */
  customTitle?: string;
  customDate?: string;
  customTime?: string;
  customLocation?: string;
  customAttendees?: string;
}

const STORAGE_KEY = "meetflow-meeting-minutes-v1";

const DEMO_MINUTES: MeetingMinutes[] = [
  {
    meetingId: "meeting-5",
    agenda:
      "주간 KPI 점검, 운영 이슈 공유, 다음 주 우선순위 합의",
    discussion:
      "전환율 지표는 전주 대비 3% 상승했습니다. 고객 문의 급증 구간에 응대 SLA를 48시간에서 24시간으로 단축하기로 결정했습니다.",
    actionItems:
      "김서연: 응대 SLA 가이드 업데이트 (7/15)\n이준호: 주간 리포트 대시보드 필터 추가 (7/16)",
    notes: "다음 주 회의는 같은 시간에 온라인으로 진행합니다.",
    updatedAt: new Date().toISOString(),
  },
];

function readAll(): Record<string, MeetingMinutes> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = Object.fromEntries(
        DEMO_MINUTES.map((item) => [item.meetingId, item])
      );
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as Record<string, MeetingMinutes>;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, MeetingMinutes>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getMeetingMinutes(meetingId: string): MeetingMinutes | null {
  const all = readAll();
  return all[meetingId] ?? null;
}

export function hasMeetingMinutes(meetingId: string): boolean {
  return Boolean(getMeetingMinutes(meetingId));
}

export function saveMeetingMinutes(
  minutes: Omit<MeetingMinutes, "updatedAt"> & { updatedAt?: string }
): MeetingMinutes {
  const all = readAll();
  const next: MeetingMinutes = {
    ...minutes,
    updatedAt: minutes.updatedAt ?? new Date().toISOString(),
  };
  all[minutes.meetingId] = next;
  writeAll(all);
  return next;
}

export function listMeetingMinutesIds(): string[] {
  return Object.keys(readAll());
}
