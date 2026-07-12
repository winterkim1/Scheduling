import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

import type { Meeting } from "@/types";

export function getParticipantCount(meeting: Meeting): number {
  return meeting.attendees.length + 1;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return format(parseISO(date), "yyyy년 M월 d일", { locale: ko });
}

export function formatTime(date: string) {
  return format(parseISO(date), "a h:mm", { locale: ko });
}

export function formatDateTime(date: string) {
  return format(parseISO(date), "yyyy년 M월 d일 · a h:mm", { locale: ko });
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const STATUS_LABELS: Record<string, string> = {
  draft: "임시저장",
  invitation_sent: "인원 초대",
  availability_collection: "가능 시간 수집",
  matching: "매칭",
  recommendation: "리스트업",
  pending_confirmation: "확인",
  confirmed: "확정",
  change_requested: "일정 변경 요청",
  re_matching: "재매칭 중",
};

export const PRIORITY_LABELS: Record<string, string> = {
  none: "설정안함",
  low: "낮음",
  medium: "보통",
  high: "높음",
  urgent: "긴급",
};

export const CHANGE_REASON_LABELS: Record<string, string> = {
  business_meeting: "업무 미팅",
  customer_meeting: "고객 미팅",
  vacation: "휴가",
  emergency: "긴급 사유",
  other: "기타",
};

export const ROLE_LABELS: Record<string, string> = {
  organizer: "주최자",
  invitee: "대상자",
};
