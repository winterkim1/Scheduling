"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShallow } from "zustand/react/shallow";
import { useMeetingStore } from "@/store/meeting-store";
import { getUserById } from "@/lib/mock-data";
import {
  getMeetingMinutes,
  saveMeetingMinutes,
} from "@/lib/meeting-minutes";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import type { Meeting } from "@/types";

const CUSTOM_MEETING_ID = "custom";

function getAttendeeNames(meeting: Meeting, locale: "ko" | "en") {
  const names = meeting.attendees.map(
    (attendee) => getUserById(attendee.userId, locale)?.name ?? attendee.userId
  );
  const organizer = getUserById(meeting.organizerId, locale)?.name;
  if (organizer && !names.includes(organizer)) {
    names.unshift(organizer);
  }
  return names;
}

function applySavedFields(
  meetingId: string,
  setters: {
    setAgenda: (v: string) => void;
    setDiscussion: (v: string) => void;
    setActionItems: (v: string) => void;
    setNotes: (v: string) => void;
    setCustomTitle: (v: string) => void;
    setCustomDate: (v: string) => void;
    setCustomTime: (v: string) => void;
    setCustomLocation: (v: string) => void;
    setCustomAttendees: (v: string) => void;
  }
) {
  const saved = getMeetingMinutes(meetingId);
  setters.setAgenda(saved?.agenda ?? "");
  setters.setDiscussion(saved?.discussion ?? "");
  setters.setActionItems(saved?.actionItems ?? "");
  setters.setNotes(saved?.notes ?? "");
  if (meetingId === CUSTOM_MEETING_ID) {
    setters.setCustomTitle(saved?.customTitle ?? "");
    setters.setCustomDate(saved?.customDate ?? "");
    setters.setCustomTime(saved?.customTime ?? "");
    setters.setCustomLocation(saved?.customLocation ?? "");
    setters.setCustomAttendees(saved?.customAttendees ?? "");
  } else {
    setters.setCustomTitle("");
    setters.setCustomDate("");
    setters.setCustomTime("");
    setters.setCustomLocation("");
    setters.setCustomAttendees("");
  }
}

export function MeetingRecordForm() {
  const searchParams = useSearchParams();
  const meetings = useMeetingStore(useShallow((s) => s.getOrganizerMeetings()));
  const { locale, t, formatDate, formatTime } = useI18n();

  const confirmedMeetings = useMemo(
    () =>
      meetings.filter(
        (meeting) => meeting.status === "confirmed" && meeting.confirmedSlot
      ),
    [meetings]
  );

  const [meetingId, setMeetingId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [customAttendees, setCustomAttendees] = useState("");
  const [agenda, setAgenda] = useState("");
  const [discussion, setDiscussion] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [notes, setNotes] = useState("");

  const isCustomMode = meetingId === CUSTOM_MEETING_ID;

  useEffect(() => {
    const fromQuery = searchParams.get("meetingId");
    if (fromQuery) {
      setMeetingId(fromQuery);
      return;
    }
    if (meetingId) return;
    setMeetingId(
      confirmedMeetings.length > 0 ? confirmedMeetings[0].id : CUSTOM_MEETING_ID
    );
  }, [confirmedMeetings, meetingId, searchParams]);

  useEffect(() => {
    if (!meetingId) return;
    applySavedFields(meetingId, {
      setAgenda,
      setDiscussion,
      setActionItems,
      setNotes,
      setCustomTitle,
      setCustomDate,
      setCustomTime,
      setCustomLocation,
      setCustomAttendees,
    });
  }, [meetingId]);

  const selectedMeeting = confirmedMeetings.find(
    (meeting) => meeting.id === meetingId
  );

  const handleMeetingChange = (nextMeetingId: string) => {
    setMeetingId(nextMeetingId);
  };

  const handleSave = () => {
    if (isCustomMode) {
      if (!customTitle.trim()) {
        toast.error(t.meetingRecord.errorCustomTitle);
        return;
      }
      saveMeetingMinutes({
        meetingId: `custom-${Date.now()}`,
        agenda,
        discussion,
        actionItems,
        notes,
        customTitle: customTitle.trim(),
        customDate,
        customTime,
        customLocation,
        customAttendees,
      });
      toast.success(t.toast.meetingRecordSaved);
      return;
    }
    if (!selectedMeeting) {
      toast.error(t.meetingRecord.selectPlaceholder);
      return;
    }
    saveMeetingMinutes({
      meetingId: selectedMeeting.id,
      agenda,
      discussion,
      actionItems,
      notes,
    });
    toast.success(t.toast.meetingRecordSaved);
  };

  const showRecordForm = Boolean(selectedMeeting || isCustomMode);

  const slot = selectedMeeting?.confirmedSlot;
  const attendeeNames = selectedMeeting
    ? getAttendeeNames(selectedMeeting, locale)
    : [];

  const summaryItems = selectedMeeting
    ? [
        {
          icon: Calendar,
          label: t.meetingRecord.dateTime,
          value: slot ? formatDate(slot.start) : t.meetings.notSet,
        },
        {
          icon: Clock,
          label: t.meetings.meetingTime,
          value: slot
            ? `${formatTime(slot.start)} – ${formatTime(slot.end)}`
            : t.meetings.notSet,
        },
        {
          icon: MapPin,
          label: t.meetingRecord.location,
          value: selectedMeeting.location || t.meetings.notSet,
        },
        {
          icon: Users,
          label: t.meetingRecord.attendees,
          value: attendeeNames.join(", "),
        },
      ]
    : [];

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.meetingRecord.selectMeeting}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={meetingId} onValueChange={handleMeetingChange}>
            <SelectTrigger>
              <SelectValue placeholder={t.meetingRecord.selectPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {confirmedMeetings.map((meeting) => (
                <SelectItem key={meeting.id} value={meeting.id}>
                  {meeting.title}
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM_MEETING_ID}>
                {t.meetingRecord.customInput}
              </SelectItem>
            </SelectContent>
          </Select>
          {confirmedMeetings.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {t.meetingRecord.noConfirmedMeetings}
            </p>
          )}
        </CardContent>
      </Card>

      {showRecordForm && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.meetingRecord.basicInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCustomMode ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-title">{t.meetingRecord.meetingTitle}</Label>
                    <Input
                      id="custom-title"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder={t.meetingRecord.customTitlePlaceholder}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="custom-date">{t.meetingRecord.dateTime}</Label>
                      <Input
                        id="custom-date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        placeholder={t.meetingRecord.customDatePlaceholder}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-time">{t.meetings.meetingTime}</Label>
                      <Input
                        id="custom-time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        placeholder={t.meetingRecord.customTimePlaceholder}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-location">{t.meetingRecord.location}</Label>
                    <Input
                      id="custom-location"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      placeholder={t.meetingRecord.customLocationPlaceholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-attendees">{t.meetingRecord.attendees}</Label>
                    <Input
                      id="custom-attendees"
                      value={customAttendees}
                      onChange={(e) => setCustomAttendees(e.target.value)}
                      placeholder={t.meetingRecord.customAttendeesPlaceholder}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t.meetingRecord.meetingTitle}
                    </p>
                    <p className="font-semibold mt-1">{selectedMeeting?.title}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {summaryItems.map(({ icon: Icon, label, value }) => (
                      <div
                        key={label}
                        className="rounded-md border bg-muted/30 p-3 flex items-start gap-2"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground">{label}</p>
                          <p className="text-sm font-medium">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.meetingRecord.bodyTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="agenda">{t.meetingRecord.agenda}</Label>
                <Textarea
                  id="agenda"
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder={t.meetingRecord.agendaPlaceholder}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discussion">{t.meetingRecord.discussion}</Label>
                <Textarea
                  id="discussion"
                  value={discussion}
                  onChange={(e) => setDiscussion(e.target.value)}
                  placeholder={t.meetingRecord.discussionPlaceholder}
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actionItems">{t.meetingRecord.actionItems}</Label>
                <Textarea
                  id="actionItems"
                  value={actionItems}
                  onChange={(e) => setActionItems(e.target.value)}
                  placeholder={t.meetingRecord.actionItemsPlaceholder}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t.meetingRecord.notes}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.meetingRecord.notesPlaceholder}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave}>{t.meetingRecord.save}</Button>
          </div>
        </>
      )}
    </motion.div>
  );
}
