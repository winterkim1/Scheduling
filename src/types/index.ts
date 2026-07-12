export type UserRole = "organizer" | "invitee";

export type MeetingStatus =
  | "draft"
  | "invitation_sent"
  | "availability_collection"
  | "matching"
  | "recommendation"
  | "pending_confirmation"
  | "confirmed"
  | "change_requested"
  | "re_matching";

export type MeetingPriority = "none" | "low" | "medium" | "high" | "urgent";

export type AvailabilityState = "available" | "preferred_not" | "unavailable";

export type DayLeavePreset =
  | "none"
  | "full_day"
  | "morning_half"
  | "afternoon_half";

/** Soft preference for matching tie-breaks; empty / unset is allowed. */
export type PreferredTimeBand = "morning" | "afternoon" | "evening";

export type OrganizerAvailabilityResponse = "no_response" | "responded";

export type AttendeeParticipationStatus =
  | "pending"
  | "available"
  | "unavailable"
  | "tentative";

export type ChangeRequestReason =
  | "business_meeting"
  | "customer_meeting"
  | "vacation"
  | "emergency"
  | "other"
  | "custom";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  department: string;
  jobTitle: string;
}

export interface TimeSlot {
  id: string;
  start: string;
  end: string;
  date: string;
}

export interface Attendee {
  userId: string;
  isRequired: boolean;
  hasResponded: boolean;
  confirmationStatus?: "pending" | "accepted" | "declined";
  participationStatus?: Exclude<AttendeeParticipationStatus, "pending">;
}

export interface AvailabilityEntry {
  userId: string;
  slotId: string;
  state: AvailabilityState;
}

export interface Recommendation {
  slot: TimeSlot;
  requiredAttendance: number;
  requiredTotal: number;
  optionalAttendance: number;
  optionalTotal: number;
  preferredNotCount: number;
  unavailableCount: number;
  unavailableOptionalCount: number;
  overallAttendance: number;
  totalAttendees: number;
  preferredNotUserIds: string[];
  rank: number;
}

export interface ChangeRequest {
  id: string;
  userId: string;
  reason: ChangeRequestReason;
  note?: string;
  createdAt: string;
  isRequired: boolean;
}

export interface AvailabilityChangeLog {
  id: string;
  userId: string;
  reason: ChangeRequestReason;
  note?: string;
  summary: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  duration: number;
  candidateDateRange: { start: string; end: string };
  responseDeadline: string;
  priority: MeetingPriority;
  status: MeetingStatus;
  organizerId: string;
  organizerHasResponded?: boolean;
  attendees: Attendee[];
  candidateSlots: TimeSlot[];
  availability: AvailabilityEntry[];
  dayLeavePresetsByUser?: Record<string, Record<string, DayLeavePreset>>;
  /** Per-user preferred time bands (optional). Empty array / missing = unset. */
  preferredTimeBandsByUser?: Record<string, PreferredTimeBand[]>;
  recommendations: Recommendation[];
  selectedRecommendationIndex?: number;
  confirmedSlot?: TimeSlot;
  location?: string;
  changeRequests: ChangeRequest[];
  availabilityChangeLogs?: AvailabilityChangeLog[];
  manualCoordinationMode: boolean;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
}

export interface Notification {
  id: string;
  type:
    | "invitation"
    | "reminder"
    | "confirmation_required"
    | "meeting_confirmed"
    | "meeting_changed"
    | "change_request"
    | "re_matching";
  title: string;
  message: string;
  footnote?: string;
  meetingId?: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  averageConfirmationTime: number;
  averageAttendance: number;
  firstRecommendationAdoption: number;
  totalMeetings: number;
  confirmedMeetings: number;
  pendingResponses: number;
}

export interface CreateMeetingInput {
  title: string;
  description: string;
  location?: string;
  duration: number;
  candidateDateRange: { start: string; end: string };
  responseDeadline: string;
  priority: MeetingPriority;
  requiredAttendeeIds: string[];
  optionalAttendeeIds: string[];
}

export type ResponseReminderInterval = "3_days" | "1_day" | "6_hours" | "3_hours";

export interface ResponseReminderSettings {
  enabled: boolean;
  intervals: ResponseReminderInterval[];
}

export const RESPONSE_REMINDER_INTERVALS: ResponseReminderInterval[] = [
  "3_days",
  "1_day",
  "6_hours",
  "3_hours",
];

export const DEFAULT_RESPONSE_REMINDER_SETTINGS: ResponseReminderSettings = {
  enabled: true,
  intervals: ["3_days", "1_day"],
};
