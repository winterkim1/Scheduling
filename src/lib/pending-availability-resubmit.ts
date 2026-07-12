import type { AvailabilityEntry, ChangeRequestReason } from "@/types";

export interface PendingAvailabilityResubmit {
  meetingId: string;
  userId: string;
  reason: ChangeRequestReason;
  note?: string;
  previousAvailability: AvailabilityEntry[];
}

const SESSION_KEY = "meetflow-pending-availability-resubmit";

export function savePendingAvailabilityResubmit(
  pending: PendingAvailabilityResubmit
): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(pending));
}

export function loadPendingAvailabilityResubmit(): PendingAvailabilityResubmit | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingAvailabilityResubmit;
  } catch {
    return null;
  }
}

export function clearPendingAvailabilityResubmitSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}
