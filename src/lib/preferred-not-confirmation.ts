import { format, parseISO } from "date-fns";
import { PREFERRED_SLOT_DEMO_NOTIFICATION_ID } from "@/lib/demo-data";
import type { Meeting, Notification } from "@/types";

export interface PreferredNotConfirmationPending {
  meetingId: string;
  userId: string;
  notificationId: string;
  slotDate: string;
  slotTime: string;
}

export function isPreferredNotConfirmationNotification(
  notification: Notification
): boolean {
  return notification.id === PREFERRED_SLOT_DEMO_NOTIFICATION_ID;
}

export function shouldShowPreferredNotConfirmation(
  meeting: Meeting,
  userId: string,
  pending: PreferredNotConfirmationPending | null
): boolean {
  if (!pending) return false;
  if (pending.meetingId !== meeting.id || pending.userId !== userId) return false;

  const slot = meeting.candidateSlots.find(
    (item) =>
      item.date === pending.slotDate &&
      format(parseISO(item.start), "HH:mm") === pending.slotTime
  );
  if (!slot) return false;

  const entry = meeting.availability.find(
    (item) => item.userId === userId && item.slotId === slot.id
  );
  return entry?.state === "preferred_not";
}
