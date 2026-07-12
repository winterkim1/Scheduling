const PREBUILT_MEETING_IDS = new Set([
  "meeting-1",
  "meeting-2",
  "meeting-3",
  "meeting-4",
  "meeting-5",
  "meeting-6",
  "meeting-7",
]);

export function isPrebuiltMeetingId(id: string): boolean {
  return PREBUILT_MEETING_IDS.has(id);
}

export function getMeetingDetailPath(id: string): string {
  if (isPrebuiltMeetingId(id)) {
    return `/meetings/${id}/`;
  }
  return `/meetings/detail/?id=${encodeURIComponent(id)}`;
}

export function getMeetingAvailabilityPath(id: string): string {
  if (isPrebuiltMeetingId(id)) {
    return `/meetings/${id}/availability/`;
  }
  return `/meetings/detail/availability/?id=${encodeURIComponent(id)}`;
}
