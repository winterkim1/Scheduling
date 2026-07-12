import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addDays, format, parseISO } from "date-fns";
import type {
  Meeting,
  Notification,
  CreateMeetingInput,
  AvailabilityState,
  DayLeavePreset,
  PreferredTimeBand,
  ChangeRequestReason,
  DashboardStats,
  ResponseReminderInterval,
  ResponseReminderSettings,
} from "@/types";
import { DEFAULT_RESPONSE_REMINDER_SETTINGS } from "@/types";
import {
  generateCandidateSlots,
  remapPlaceholderAvailability,
} from "@/lib/slot-utils";
import { runMatchingEngine } from "@/lib/matching-engine";
import { CURRENT_USER_ID, getUserById } from "@/lib/mock-data";
import {
  getUserAvailabilityEntries,
  summarizeAvailabilityChanges,
} from "@/lib/availability-change-utils";
import {
  clearPendingAvailabilityResubmitSession,
  loadPendingAvailabilityResubmit,
  savePendingAvailabilityResubmit,
  type PendingAvailabilityResubmit,
} from "@/lib/pending-availability-resubmit";
import {
  applyDayLeavePresetToAvailability,
  upsertUserSlotAvailability,
} from "@/lib/day-leave-utils";
import {
  getDemoMeetings,
  getDemoNotifications,
  mergeDemoNotifications,
  localizeMeetings,
  buildMeeting1Recommendations,
  MEETING_1_CANDIDATE_DATE_RANGE,
  MEETING_4_SCHEDULED_DATE,
  MEETING_7_CANDIDATE_DATE_RANGE,
  seedMeeting1RecommendationAvailability,
  seedMeeting7MatchingAvailability,
  MEETING_1_RESPONSE_DEADLINE,
  MEETING_2_RESPONSE_DEADLINE,
} from "@/lib/demo-data";
import { getTranslations } from "@/lib/i18n/translations";
import type { Locale } from "@/lib/i18n/types";

function createNotification(
  type: Notification["type"],
  title: string,
  message: string,
  meetingId?: string
): Notification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    message,
    meetingId,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

function createMeetingConfirmedNotifications(
  meeting: Meeting,
  meetingId: string,
  locale: Locale
): Notification[] {
  const t = getTranslations(locale);
  return [
    createNotification(
      "meeting_confirmed",
      t.status.confirmed,
      t.notifications.meetingConfirmedBroadcast(meeting.title),
      meetingId
    ),
  ];
}

function applyPrebuiltDemoStatus(meetings: Meeting[], locale: Locale): Meeting[] {
  const demoMeetings = new Map(
    getDemoMeetings(locale).map((meeting) => [meeting.id, meeting])
  );

  return meetings.map((meeting) => {
    const demo = demoMeetings.get(meeting.id);
    if (!demo || demo.status === meeting.status) {
      return meeting;
    }

    if (meeting.id === "meeting-7" && meeting.status !== "matching") {
      return initializeMeetingSlots({
        ...meeting,
        status: demo.status,
        availabilityChangeLogs: meeting.availabilityChangeLogs,
      });
    }

    return meeting;
  });
}

function normalizeRecommendationResponses(meeting: Meeting): Meeting {
  if (meeting.status !== "recommendation") return meeting;
  return {
    ...meeting,
    organizerHasResponded: true,
    attendees: meeting.attendees.map((attendee) =>
      attendee.hasResponded ? attendee : { ...attendee, hasResponded: true }
    ),
  };
}

function applyMeetingDemoOverrides(meeting: Meeting): Meeting {
  if (meeting.id === "meeting-1") {
    return {
      ...meeting,
      priority: "urgent",
      candidateDateRange: { ...MEETING_1_CANDIDATE_DATE_RANGE },
      responseDeadline: MEETING_1_RESPONSE_DEADLINE,
      preferredTimeBandsByUser: {
        [CURRENT_USER_ID]: ["morning", "afternoon"],
        "user-2": ["morning"],
        "user-3": ["afternoon"],
        "user-4": ["morning", "afternoon"],
        "user-5": ["evening"],
        "user-6": ["afternoon"],
      },
    };
  }

  if (meeting.id === "meeting-2") {
    return {
      ...meeting,
      responseDeadline: MEETING_2_RESPONSE_DEADLINE,
    };
  }

  if (meeting.id === "meeting-4") {
    return {
      ...meeting,
      priority: "none",
      candidateDateRange: {
        start: MEETING_4_SCHEDULED_DATE,
        end: MEETING_4_SCHEDULED_DATE,
      },
      confirmedSlot: meeting.confirmedSlot
        ? {
            ...meeting.confirmedSlot,
            date: MEETING_4_SCHEDULED_DATE,
            start: `${MEETING_4_SCHEDULED_DATE}T10:00:00.000Z`,
            end: `${MEETING_4_SCHEDULED_DATE}T12:00:00.000Z`,
          }
        : meeting.confirmedSlot,
    };
  }

  if (meeting.id === "meeting-7") {
    return {
      ...meeting,
      candidateDateRange: { ...MEETING_7_CANDIDATE_DATE_RANGE },
    };
  }

  return meeting;
}

function initializeMeetingSlots(meeting: Meeting): Meeting {
  const meetingForSlots = applyMeetingDemoOverrides(meeting);
  const slots = generateCandidateSlots(
    meetingForSlots.candidateDateRange.start,
    meetingForSlots.candidateDateRange.end,
    meetingForSlots.duration
  );
  const remappedAvailability = remapPlaceholderAvailability(
    meeting.id === "meeting-1"
      ? (getDemoMeetings("ko").find((item) => item.id === "meeting-1")?.availability ??
          meetingForSlots.availability)
      : meetingForSlots.availability,
    slots
  );
  const availability =
    meeting.id === "meeting-1"
      ? seedMeeting1RecommendationAvailability(remappedAvailability, slots)
      : meeting.id === "meeting-7"
        ? seedMeeting7MatchingAvailability(remappedAvailability, slots)
        : remappedAvailability;
  const hasSeededAvailability =
    meeting.id === "meeting-1" || meeting.id === "meeting-7";
  const updated = normalizeRecommendationResponses({
    ...meetingForSlots,
    candidateSlots: slots,
    availability:
      slots.length > 0 &&
      (meetingForSlots.availability.length > 0 || hasSeededAvailability)
        ? availability
        : meetingForSlots.availability,
  });
  if (updated.status === "recommendation") {
    updated.recommendations =
      updated.id === "meeting-1"
        ? buildMeeting1Recommendations(updated)
        : runMatchingEngine(updated);
  }
  return updated;
}

function initMeetings(locale: Locale): Meeting[] {
  return getDemoMeetings(locale).map(initializeMeetingSlots);
}

interface MeetingStore {
  meetings: Meeting[];
  notifications: Notification[];
  dismissedNotificationIds: string[];
  darkMode: boolean;
  locale: Locale;
  responseReminderSettings: ResponseReminderSettings;
  currentRole: "organizer" | "invitee";
  viewingAsUserId: string;

  setLocale: (locale: Locale) => void;
  createMeeting: (input: CreateMeetingInput) => Meeting;
  getMeeting: (id: string) => Meeting | undefined;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  sendInvitations: (id: string) => void;
  setAvailability: (
    meetingId: string,
    userId: string,
    slotId: string,
    state: AvailabilityState
  ) => void;
  setDayLeavePreset: (
    meetingId: string,
    userId: string,
    date: string,
    preset: DayLeavePreset
  ) => void;
  setPreferredTimeBands: (
    meetingId: string,
    userId: string,
    bands: PreferredTimeBand[]
  ) => void;
  submitAvailability: (meetingId: string, userId: string) => void;
  pendingAvailabilityResubmit: PendingAvailabilityResubmit | null;
  setPendingAvailabilityResubmit: (
    meetingId: string,
    userId: string,
    reason: ChangeRequestReason,
    note?: string
  ) => void;
  clearPendingAvailabilityResubmit: () => void;
  resubmitAvailability: (meetingId: string, userId: string) => void;
  runMatching: (id: string) => void;
  selectRecommendation: (meetingId: string, index: number) => void;
  confirmMeetingSlot: (meetingId: string, slotId: string) => void;
  sendConfirmationRequests: (meetingId: string, index: number) => void;
  sendConfirmationRequestToUser: (
    meetingId: string,
    userId: string,
    options: {
      slotStart: string;
      message: string;
      recommendationIndex?: number;
    }
  ) => void;
  extendSchedulingWindow: (meetingId: string, days?: number) => void;
  respondToConfirmation: (
    meetingId: string,
    userId: string,
    accept: boolean
  ) => void;
  respondToPreferredNotConfirmation: (
    meetingId: string,
    userId: string,
    accept: boolean,
    slotDate: string,
    slotTime: string,
    declineReason?: string
  ) => void;
  confirmMeeting: (meetingId: string) => void;
  requestChange: (
    meetingId: string,
    userId: string,
    reason: ChangeRequestReason,
    note?: string
  ) => void;
  handleChangeRequest: (
    meetingId: string,
    action: "keep" | "re_coordinate"
  ) => void;
  cancelChangeRequest: (meetingId: string, userId: string) => void;
  toggleManualCoordination: (meetingId: string) => void;
  toggleDarkMode: () => void;
  toggleResponseReminder: () => void;
  toggleResponseReminderInterval: (interval: ResponseReminderInterval) => void;
  setViewingAs: (userId: string) => void;
  markNotificationRead: (id: string) => void;
  markNotificationUnread: (id: string) => void;
  deleteNotification: (id: string) => void;
  getDashboardStats: () => DashboardStats;
  getOrganizerMeetings: () => Meeting[];
  getInviteeMeetings: (userId: string) => Meeting[];
}

export const useMeetingStore = create<MeetingStore>()(
  persist(
    (set, get) => ({
      meetings: initMeetings("ko"),
      notifications: getDemoNotifications("ko"),
      dismissedNotificationIds: [],
      darkMode: false,
      locale: "ko",
      responseReminderSettings: DEFAULT_RESPONSE_REMINDER_SETTINGS,
      currentRole: "organizer",
      viewingAsUserId: CURRENT_USER_ID,
      pendingAvailabilityResubmit: null,

      setLocale: (locale) => {
        set((s) => {
          const dismissed = new Set(s.dismissedNotificationIds);
          return {
            locale,
            meetings: localizeMeetings(s.meetings, locale),
            notifications: mergeDemoNotifications(
              s.notifications,
              locale,
              dismissed
            ),
          };
        });
      },

      createMeeting: (input) => {
        const slots = generateCandidateSlots(
          input.candidateDateRange.start,
          input.candidateDateRange.end,
          input.duration
        );
        const meeting: Meeting = {
          id: `meeting-${Date.now()}`,
          title: input.title,
          description: input.description,
          location: input.location?.trim() || undefined,
          duration: input.duration,
          candidateDateRange: input.candidateDateRange,
          responseDeadline: input.responseDeadline,
          priority: input.priority,
          status: "draft",
          organizerId: CURRENT_USER_ID,
          organizerHasResponded: false,
          attendees: [
            ...input.requiredAttendeeIds.map((id) => ({
              userId: id,
              isRequired: true,
              hasResponded: false,
            })),
            ...input.optionalAttendeeIds.map((id) => ({
              userId: id,
              isRequired: false,
              hasResponded: false,
            })),
          ],
          candidateSlots: slots,
          availability: [],
          recommendations: [],
          manualCoordinationMode: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          changeRequests: [],
          availabilityChangeLogs: [],
        };
        set((s) => ({ meetings: [meeting, ...s.meetings] }));
        return meeting;
      },

      getMeeting: (id) => get().meetings.find((m) => m.id === id),

      updateMeeting: (id, updates) => {
        set((s) => ({
          meetings: s.meetings.map((m) =>
            m.id === id
              ? { ...m, ...updates, updatedAt: new Date().toISOString() }
              : m
          ),
        }));
      },

      sendInvitations: (id) => {
        const meeting = get().getMeeting(id);
        if (!meeting) return;
        const t = getTranslations(get().locale);
        get().updateMeeting(id, { status: "invitation_sent" });
        setTimeout(() => {
          get().updateMeeting(id, { status: "availability_collection" });
          set((s) => ({
            notifications: [
              createNotification(
                "invitation",
                t.notifications.new,
                `${meeting.title}`,
                id
              ),
              ...s.notifications,
            ],
          }));
        }, 500);
      },

      setAvailability: (meetingId, userId, slotId, state) => {
        set((s) => ({
          meetings: s.meetings.map((m) => {
            if (m.id !== meetingId) return m;

            const slot = m.candidateSlots.find((candidate) => candidate.id === slotId);
            let dayLeavePresetsByUser = m.dayLeavePresetsByUser;

            if (slot && dayLeavePresetsByUser?.[userId]?.[slot.date]) {
              const userPresets = { ...dayLeavePresetsByUser[userId] };
              delete userPresets[slot.date];
              dayLeavePresetsByUser = {
                ...dayLeavePresetsByUser,
                [userId]: userPresets,
              };
            }

            return {
              ...m,
              dayLeavePresetsByUser,
              availability: upsertUserSlotAvailability(
                m.availability,
                userId,
                slotId,
                state
              ),
            };
          }),
        }));
      },

      setDayLeavePreset: (meetingId, userId, date, preset) => {
        set((s) => ({
          meetings: s.meetings.map((m) => {
            if (m.id !== meetingId) return m;

            const userPresets = {
              ...(m.dayLeavePresetsByUser?.[userId] ?? {}),
              [date]: preset,
            };

            if (preset === "none") {
              delete userPresets[date];
            }

            const dayLeavePresetsByUser = {
              ...(m.dayLeavePresetsByUser ?? {}),
              [userId]: userPresets,
            };

            if (Object.keys(userPresets).length === 0) {
              delete dayLeavePresetsByUser[userId];
            }

            return {
              ...m,
              dayLeavePresetsByUser:
                Object.keys(dayLeavePresetsByUser).length > 0
                  ? dayLeavePresetsByUser
                  : undefined,
              availability: applyDayLeavePresetToAvailability(
                m.availability,
                m.candidateSlots,
                userId,
                date,
                preset
              ),
            };
          }),
        }));
      },

      setPreferredTimeBands: (meetingId, userId, bands) => {
        set((s) => ({
          meetings: s.meetings.map((m) => {
            if (m.id !== meetingId) return m;

            const preferredTimeBandsByUser = {
              ...(m.preferredTimeBandsByUser ?? {}),
            };

            if (bands.length === 0) {
              delete preferredTimeBandsByUser[userId];
            } else {
              preferredTimeBandsByUser[userId] = bands;
            }

            return {
              ...m,
              preferredTimeBandsByUser:
                Object.keys(preferredTimeBandsByUser).length > 0
                  ? preferredTimeBandsByUser
                  : undefined,
            };
          }),
        }));
      },

      submitAvailability: (meetingId, userId) => {
        set((s) => ({
          meetings: s.meetings.map((m) => {
            if (m.id !== meetingId) return m;
            if (userId === m.organizerId) {
              const allAttendeesResponded = m.attendees.every((a) => a.hasResponded);
              return {
                ...m,
                organizerHasResponded: true,
                status: allAttendeesResponded ? "matching" : m.status,
              };
            }
            const attendees = m.attendees.map((a) =>
              a.userId === userId ? { ...a, hasResponded: true } : a
            );
            const allResponded =
              attendees.every((a) => a.hasResponded) && m.organizerHasResponded;
            return {
              ...m,
              attendees,
              status: allResponded ? "matching" : m.status,
            };
          }),
        }));

        const meeting = get().getMeeting(meetingId);
        const allResponded =
          meeting?.organizerHasResponded &&
          meeting.attendees.every((a) => a.hasResponded);
        if (allResponded) {
          setTimeout(() => get().runMatching(meetingId), 300);
        }
      },

      setPendingAvailabilityResubmit: (meetingId, userId, reason, note) => {
        const meeting = get().getMeeting(meetingId);
        if (!meeting) return;
        const pending: PendingAvailabilityResubmit = {
          meetingId,
          userId,
          reason,
          note,
          previousAvailability: getUserAvailabilityEntries(
            meeting.availability,
            userId
          ),
        };
        savePendingAvailabilityResubmit(pending);
        set({ pendingAvailabilityResubmit: pending });
      },

      clearPendingAvailabilityResubmit: () => {
        clearPendingAvailabilityResubmitSession();
        set({ pendingAvailabilityResubmit: null });
      },

      resubmitAvailability: (meetingId, userId) => {
        const pending =
          get().pendingAvailabilityResubmit ?? loadPendingAvailabilityResubmit();
        const meeting = get().getMeeting(meetingId);
        if (!meeting || !pending) return;
        if (pending.meetingId !== meetingId || pending.userId !== userId) return;

        const locale = get().locale;
        const t = getTranslations(locale);
        const user = getUserById(userId, locale);
        const currentAvailability = getUserAvailabilityEntries(
          meeting.availability,
          userId
        );
        const summary = summarizeAvailabilityChanges(
          pending.previousAvailability,
          currentAvailability,
          meeting.candidateSlots,
          locale,
          t
        );
        const logEntry = {
          id: `acl-${Date.now()}`,
          userId,
          reason: pending.reason,
          note: pending.note,
          summary,
          createdAt: new Date().toISOString(),
        };

        get().updateMeeting(meetingId, {
          availabilityChangeLogs: [
            logEntry,
            ...(meeting.availabilityChangeLogs ?? []),
          ],
        });

        clearPendingAvailabilityResubmitSession();
        set((s) => ({
          pendingAvailabilityResubmit: null,
          notifications: [
            createNotification(
              "meeting_changed",
              t.notifications.availabilityResubmitTitle,
              t.notifications.availabilityResubmitMessage(
                user?.name ?? t.common.unknown,
                meeting.title,
                summary
              ),
              meetingId
            ),
            ...s.notifications,
          ],
        }));
      },

      runMatching: (id) => {
        const meeting = get().getMeeting(id);
        if (!meeting) return;
        const t = getTranslations(get().locale);
        const recommendations =
          meeting.id === "meeting-1"
            ? buildMeeting1Recommendations(meeting)
            : runMatchingEngine(meeting);
        get().updateMeeting(id, {
          status: "recommendation",
          recommendations,
        });
        set((s) => ({
          notifications: [
            createNotification(
              "reminder",
              t.status.recommendation,
              meeting.title,
              id
            ),
            ...s.notifications,
          ],
        }));
      },

      selectRecommendation: (meetingId, index) => {
        const meeting = get().getMeeting(meetingId);
        if (!meeting) return;
        const rec = meeting.recommendations[index];
        if (!rec) return;
        get().confirmMeetingSlot(meetingId, rec.slot.id);
      },

      confirmMeetingSlot: (meetingId, slotId) => {
        const meeting = get().getMeeting(meetingId);
        if (!meeting) return;

        const fromRecommendations = meeting.recommendations.find(
          (rec) => rec.slot.id === slotId
        );
        const slot =
          fromRecommendations?.slot ??
          meeting.candidateSlots.find((candidate) => candidate.id === slotId);
        if (!slot) return;

        const recommendationIndex = meeting.recommendations.findIndex(
          (rec) => rec.slot.id === slotId
        );
        const locale = get().locale;

        get().updateMeeting(meetingId, {
          ...(recommendationIndex >= 0
            ? { selectedRecommendationIndex: recommendationIndex }
            : {}),
          confirmedSlot: slot,
          status: "confirmed",
          confirmedAt: new Date().toISOString(),
        });

        set((s) => ({
          notifications: [
            ...createMeetingConfirmedNotifications(meeting, meetingId, locale),
            ...s.notifications,
          ],
        }));
      },

      sendConfirmationRequests: (meetingId, index) => {
        const meeting = get().getMeeting(meetingId);
        if (!meeting) return;
        const rec = meeting.recommendations[index];
        if (!rec) return;
        const t = getTranslations(get().locale);
        const preferredIds = new Set(rec.preferredNotUserIds);
        const slotDate = format(parseISO(rec.slot.start), "yyyy-MM-dd");
        const slotTime = format(parseISO(rec.slot.start), "HH:mm");

        get().updateMeeting(meetingId, {
          selectedRecommendationIndex: index,
          status: "pending_confirmation",
          attendees: meeting.attendees.map((attendee) =>
            preferredIds.has(attendee.userId)
              ? { ...attendee, confirmationStatus: "pending" as const }
              : attendee
          ),
        });

        const requestNotifications = rec.preferredNotUserIds
          .filter((userId, i, list) => list.indexOf(userId) === i)
          .filter((userId) => userId !== meeting.organizerId)
          .map((userId) => {
            const user = getUserById(userId, get().locale);
            return createNotification(
              "confirmation_required",
              t.confirmation.requestTitle,
              `${meeting.title} · ${slotDate} ${slotTime} · ${user?.name ?? t.common.unknown}`,
              meetingId
            );
          });

        set((s) => ({
          notifications: [...requestNotifications, ...s.notifications],
        }));
      },

      sendConfirmationRequestToUser: (meetingId, userId, options) => {
        const meeting = get().getMeeting(meetingId);
        if (!meeting || userId === meeting.organizerId) return;

        const t = getTranslations(get().locale);
        const user = getUserById(userId, get().locale);
        const slotDate = format(parseISO(options.slotStart), "yyyy-MM-dd");
        const slotTime = format(parseISO(options.slotStart), "HH:mm");
        const nextStatus =
          meeting.status === "recommendation" ||
          meeting.status === "pending_confirmation"
            ? ("pending_confirmation" as const)
            : meeting.status;

        get().updateMeeting(meetingId, {
          ...(options.recommendationIndex !== undefined
            ? { selectedRecommendationIndex: options.recommendationIndex }
            : {}),
          status: nextStatus,
          attendees: meeting.attendees.map((attendee) =>
            attendee.userId === userId
              ? { ...attendee, confirmationStatus: "pending" as const }
              : attendee
          ),
        });

        set((s) => ({
          notifications: [
            createNotification(
              "confirmation_required",
              t.confirmation.requestTitle,
              `${meeting.title} · ${slotDate} ${slotTime} · ${user?.name ?? t.common.unknown}\n${options.message}`,
              meetingId
            ),
            ...s.notifications,
          ],
        }));
      },

      extendSchedulingWindow: (meetingId, days = 7) => {
        const meeting = get().getMeeting(meetingId);
        if (!meeting) return;

        const newEnd = format(
          addDays(parseISO(meeting.candidateDateRange.end), days),
          "yyyy-MM-dd"
        );
        const newDeadline = format(
          addDays(parseISO(meeting.responseDeadline), days),
          "yyyy-MM-dd"
        );
        const slots = generateCandidateSlots(
          meeting.candidateDateRange.start,
          newEnd,
          meeting.duration
        );
        const slotIds = new Set(slots.map((slot) => slot.id));

        get().updateMeeting(meetingId, {
          candidateDateRange: {
            start: meeting.candidateDateRange.start,
            end: newEnd,
          },
          responseDeadline: newDeadline,
          candidateSlots: slots,
          availability: meeting.availability.filter((entry) =>
            slotIds.has(entry.slotId)
          ),
          recommendations: [],
          selectedRecommendationIndex: undefined,
          status: "availability_collection",
          attendees: meeting.attendees.map((attendee) => ({
            ...attendee,
            hasResponded: false,
            confirmationStatus: undefined,
          })),
          organizerHasResponded: false,
        });
      },

      respondToConfirmation: (meetingId, userId, accept) => {
        set((s) => ({
          meetings: s.meetings.map((m) => {
            if (m.id !== meetingId) return m;
            const attendees = m.attendees.map((a) =>
              a.userId === userId
                ? {
                    ...a,
                    confirmationStatus: accept
                      ? ("accepted" as const)
                      : ("declined" as const),
                  }
                : a
            );
            return { ...m, attendees };
          }),
        }));

        const meeting = get().getMeeting(meetingId);
        if (!meeting) return;
        const t = getTranslations(get().locale);

        const pendingUsers = meeting.attendees.filter(
          (a) => a.confirmationStatus === "pending"
        );
        const declined = meeting.attendees.some(
          (a) => a.confirmationStatus === "declined"
        );

        if (declined) {
          get().updateMeeting(meetingId, { status: "re_matching" });
          setTimeout(() => {
            get().runMatching(meetingId);
            set((s) => ({
              notifications: [
                createNotification(
                  "re_matching",
                  t.status.re_matching,
                  meeting.title,
                  meetingId
                ),
                ...s.notifications,
              ],
            }));
          }, 500);
        } else if (pendingUsers.length === 0) {
          const rec =
            meeting.recommendations[meeting.selectedRecommendationIndex ?? 0];
          get().updateMeeting(meetingId, {
            status: "confirmed",
            confirmedSlot: rec?.slot,
            confirmedAt: new Date().toISOString(),
          });
          set((s) => ({
            notifications: [
              ...createMeetingConfirmedNotifications(
                meeting,
                meetingId,
                get().locale
              ),
              ...s.notifications,
            ],
          }));
        }
      },

      respondToPreferredNotConfirmation: (
        meetingId,
        userId,
        accept,
        slotDate,
        slotTime,
        declineReason
      ) => {
        const meeting = get().getMeeting(meetingId);
        if (!meeting) return;

        const slot = meeting.candidateSlots.find(
          (item) =>
            item.date === slotDate &&
            format(parseISO(item.start), "HH:mm") === slotTime
        );
        if (!slot) return;

        get().setAvailability(
          meetingId,
          userId,
          slot.id,
          accept ? "available" : "unavailable"
        );

        if (!accept && declineReason?.trim()) {
          const t = getTranslations(get().locale);
          const user = getUserById(userId, get().locale);
          set((s) => ({
            notifications: [
              createNotification(
                "change_request",
                t.preferredNotConfirmation.declineNotifyTitle,
                t.preferredNotConfirmation.declineNotifyMessage(
                  user?.name ?? t.common.unknown,
                  meeting.title,
                  declineReason.trim()
                ),
                meetingId
              ),
              ...s.notifications,
            ],
          }));
        }
      },

      confirmMeeting: (meetingId) => {
        const meeting = get().getMeeting(meetingId);
        if (!meeting) return;
        const rec =
          meeting.recommendations[meeting.selectedRecommendationIndex ?? 0];
        get().updateMeeting(meetingId, {
          status: "confirmed",
          confirmedSlot: rec?.slot,
          confirmedAt: new Date().toISOString(),
        });
        set((s) => ({
          notifications: [
            ...createMeetingConfirmedNotifications(
              meeting,
              meetingId,
              get().locale
            ),
            ...s.notifications,
          ],
        }));
      },

      requestChange: (meetingId, userId, reason, note) => {
        const meeting = get().getMeeting(meetingId);
        if (!meeting) return;
        const attendee = meeting.attendees.find((a) => a.userId === userId);
        const t = getTranslations(get().locale);
        const changeRequest = {
          id: `cr-${Date.now()}`,
          userId,
          reason,
          note,
          createdAt: new Date().toISOString(),
          isRequired: attendee?.isRequired ?? false,
        };
        get().updateMeeting(meetingId, {
          status: "change_requested",
          changeRequests: [...meeting.changeRequests, changeRequest],
        });
        set((s) => ({
          notifications: [
            createNotification(
              "change_request",
              t.meetings.changeRequestsTitle,
              meeting.title,
              meetingId
            ),
            ...s.notifications,
          ],
        }));
      },

      handleChangeRequest: (meetingId, action) => {
        if (action === "keep") {
          get().updateMeeting(meetingId, { status: "confirmed" });
        } else {
          get().updateMeeting(meetingId, {
            status: "re_matching",
            changeRequests: [],
          });
          setTimeout(() => get().runMatching(meetingId), 500);
        }
      },

      cancelChangeRequest: (meetingId, userId) => {
        const meeting = get().getMeeting(meetingId);
        if (!meeting) return;
        const changeRequests = meeting.changeRequests.filter(
          (request) => request.userId !== userId
        );
        get().updateMeeting(meetingId, {
          changeRequests,
          status: changeRequests.length === 0 ? "confirmed" : "change_requested",
        });
      },

      toggleManualCoordination: (meetingId) => {
        const meeting = get().getMeeting(meetingId);
        if (!meeting) return;
        get().updateMeeting(meetingId, {
          manualCoordinationMode: !meeting.manualCoordinationMode,
        });
      },

      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      toggleResponseReminder: () =>
        set((s) => ({
          responseReminderSettings: {
            ...s.responseReminderSettings,
            enabled: !s.responseReminderSettings.enabled,
          },
        })),

      toggleResponseReminderInterval: (interval) =>
        set((s) => {
          const { intervals } = s.responseReminderSettings;
          const next = intervals.includes(interval)
            ? intervals.filter((item) => item !== interval)
            : [...intervals, interval];
          return {
            responseReminderSettings: {
              ...s.responseReminderSettings,
              intervals: next,
            },
          };
        }),

      setViewingAs: (userId) => set({ viewingAsUserId: userId }),

      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markNotificationUnread: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: false } : n
          ),
        }));
      },

      deleteNotification: (id) => {
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
          dismissedNotificationIds: s.dismissedNotificationIds.includes(id)
            ? s.dismissedNotificationIds
            : [...s.dismissedNotificationIds, id],
        }));
      },

      getDashboardStats: () => {
        const meetings = get().getOrganizerMeetings();
        const confirmed = meetings.filter((m) => m.status === "confirmed");
        return {
          averageConfirmationTime: 1.8,
          averageAttendance: 87,
          firstRecommendationAdoption: 72,
          totalMeetings: meetings.length,
          confirmedMeetings: confirmed.length,
          pendingResponses: meetings.filter(
            (m) => m.status === "availability_collection"
          ).length,
        };
      },

      getOrganizerMeetings: () =>
        get().meetings.filter((m) => m.organizerId === CURRENT_USER_ID),

      getInviteeMeetings: (userId) =>
        get().meetings.filter((m) =>
          m.attendees.some((a) => a.userId === userId)
        ),
    }),
    {
      name: "meeting-scheduler-storage-v16",
      partialize: (state) => ({
        meetings: state.meetings,
        notifications: state.notifications,
        dismissedNotificationIds: state.dismissedNotificationIds,
        darkMode: state.darkMode,
        locale: state.locale,
        responseReminderSettings: state.responseReminderSettings,
        pendingAvailabilityResubmit: state.pendingAvailabilityResubmit,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.meetings = state.meetings.map(initializeMeetingSlots);
        state.meetings = applyPrebuiltDemoStatus(state.meetings, state.locale);

        const demoMeetings = getDemoMeetings(state.locale).map(
          initializeMeetingSlots
        );
        const demoById = new Map(
          demoMeetings.map((meeting) => [meeting.id, meeting])
        );
        state.meetings = state.meetings.map((meeting) => {
          const demo = demoById.get(meeting.id);
          if (!demo) return meeting;
          return {
            ...meeting,
            priority: demo.priority,
            location: demo.location,
            responseDeadline: demo.responseDeadline,
          };
        });

        const demoOrder = new Map(
          demoMeetings.map((meeting, index) => [meeting.id, index])
        );
        state.meetings = [...state.meetings].sort((a, b) => {
          const aOrder = demoOrder.get(a.id);
          const bOrder = demoOrder.get(b.id);
          if (aOrder === undefined && bOrder === undefined) return 0;
          if (aOrder === undefined) return 1;
          if (bOrder === undefined) return -1;
          return aOrder - bOrder;
        });

        const persistedMeetingIds = new Set(state.meetings.map((m) => m.id));
        for (const demoMeeting of demoMeetings) {
          if (!persistedMeetingIds.has(demoMeeting.id)) {
            state.meetings.push(demoMeeting);
          }
        }

        // Keep demo meeting order after appending any missing demos
        state.meetings = [...state.meetings].sort((a, b) => {
          const aOrder = demoOrder.get(a.id);
          const bOrder = demoOrder.get(b.id);
          if (aOrder === undefined && bOrder === undefined) return 0;
          if (aOrder === undefined) return 1;
          if (bOrder === undefined) return -1;
          return aOrder - bOrder;
        });

        if (!state.pendingAvailabilityResubmit) {
          state.pendingAvailabilityResubmit = loadPendingAvailabilityResubmit();
        }

        const dismissedNotificationIds = new Set(
          state.dismissedNotificationIds ?? []
        );
        state.dismissedNotificationIds = [...dismissedNotificationIds];
        state.notifications = mergeDemoNotifications(
          state.notifications,
          state.locale,
          dismissedNotificationIds
        );

        state.responseReminderSettings = {
          enabled:
            state.responseReminderSettings?.enabled ??
            DEFAULT_RESPONSE_REMINDER_SETTINGS.enabled,
          intervals:
            state.responseReminderSettings?.intervals ??
            DEFAULT_RESPONSE_REMINDER_SETTINGS.intervals,
        };
      },
    }
  )
);
