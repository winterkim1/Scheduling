export type Locale = "ko" | "en";

export type StatusKey =
  | "draft"
  | "invitation_sent"
  | "availability_collection"
  | "matching"
  | "recommendation"
  | "pending_confirmation"
  | "confirmed"
  | "change_requested"
  | "re_matching";

export type PriorityKey = "none" | "low" | "medium" | "high" | "urgent";

export type ChangeReasonKey =
  | "business_meeting"
  | "customer_meeting"
  | "vacation"
  | "emergency"
  | "other"
  | "custom";
