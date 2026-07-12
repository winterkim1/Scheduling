import type { Meeting } from "@/types";
import { getMeetingEventDate, isPastMeeting } from "./meeting-utils";

export type DashboardListType = "pending" | "confirmation" | "recent";

export function getPendingResponseMeetings(meetings: Meeting[]): Meeting[] {
  return meetings.filter((m) => m.status === "availability_collection");
}

export function getAwaitingConfirmationMeetings(meetings: Meeting[]): Meeting[] {
  return meetings.filter((m) => m.status === "recommendation");
}

export function getRecentMeetings(meetings: Meeting[]): Meeting[] {
  return meetings
    .filter((m) => m.status === "confirmed" && isPastMeeting(m))
    .sort((a, b) => {
      const da = getMeetingEventDate(a)?.getTime() ?? 0;
      const db = getMeetingEventDate(b)?.getTime() ?? 0;
      return db - da;
    });
}

export function getDashboardMeetings(
  meetings: Meeting[],
  type: DashboardListType
): Meeting[] {
  switch (type) {
    case "pending":
      return getPendingResponseMeetings(meetings);
    case "confirmation":
      return getAwaitingConfirmationMeetings(meetings);
    case "recent":
      return getRecentMeetings(meetings);
  }
}

export const DASHBOARD_LIST_TYPES: DashboardListType[] = [
  "pending",
  "confirmation",
  "recent",
];
