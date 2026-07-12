import type { Notification } from "@/types";

export function sortNotificationsByCreatedAtDesc(
  notifications: Notification[]
): Notification[] {
  return [...notifications].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
