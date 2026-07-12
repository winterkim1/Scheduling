import type { Notification } from "@/types";

export function getNotificationIconStyles(type: Notification["type"]): {
  container: string;
  icon: string;
} {
  switch (type) {
    case "invitation":
      return {
        container: "bg-blue-50 dark:bg-blue-950/50",
        icon: "text-blue-600 dark:text-blue-400",
      };
    case "reminder":
      return {
        container: "bg-amber-50 dark:bg-amber-950/50",
        icon: "text-amber-600 dark:text-amber-400",
      };
    case "confirmation_required":
    case "change_request":
    case "meeting_changed":
      return {
        container: "bg-red-50 dark:bg-red-950/50",
        icon: "text-red-600 dark:text-red-400",
      };
    case "meeting_confirmed":
      return {
        container: "bg-green-50 dark:bg-green-950/50",
        icon: "text-green-600 dark:text-green-400",
      };
    case "re_matching":
      return {
        container: "bg-amber-50 dark:bg-amber-950/50",
        icon: "text-amber-600 dark:text-amber-400",
      };
    default:
      return {
        container: "bg-muted",
        icon: "text-muted-foreground",
      };
  }
}
