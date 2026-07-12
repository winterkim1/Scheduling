"use client";

import { AppLink } from "@/components/app-link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvailabilityGrid } from "@/components/meetings/availability-grid";
import { useMeetingStore } from "@/store/meeting-store";
import { getMeetingDetailPath } from "@/lib/meeting-routes";
import { navigateTo, staticHref } from "@/lib/navigation";
import { useMeetingStoreHydrated } from "@/lib/use-store-hydration";
import { userHasSubmittedAvailability } from "@/lib/meeting-utils";
import {
  loadPendingAvailabilityResubmit,
} from "@/lib/pending-availability-resubmit";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

interface MeetingAvailabilityViewProps {
  id: string;
}

export function MeetingAvailabilityView({ id }: MeetingAvailabilityViewProps) {
  const hydrated = useMeetingStoreHydrated();
  const meeting = useMeetingStore((s) => s.getMeeting(id));
  const viewingAsUserId = useMeetingStore((s) => s.viewingAsUserId);
  const pendingAvailabilityResubmit = useMeetingStore(
    (s) => s.pendingAvailabilityResubmit
  );
  const setAvailability = useMeetingStore((s) => s.setAvailability);
  const setDayLeavePreset = useMeetingStore((s) => s.setDayLeavePreset);
  const submitAvailability = useMeetingStore((s) => s.submitAvailability);
  const resubmitAvailability = useMeetingStore((s) => s.resubmitAvailability);
  const clearPendingAvailabilityResubmit = useMeetingStore(
    (s) => s.clearPendingAvailabilityResubmit
  );
  const { t } = useI18n();

  if (!hydrated) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading...</div>
    );
  }

  if (!meeting) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{t.meetings.notFound}</p>
      </div>
    );
  }

  const isResubmitFlow = (() => {
    const pending =
      pendingAvailabilityResubmit ?? loadPendingAvailabilityResubmit();
    return (
      pending?.meetingId === id && pending.userId === viewingAsUserId
    );
  })();
  const hasSubmittedAvailability = userHasSubmittedAvailability(
    meeting,
    viewingAsUserId
  );

  const handleSubmit = () => {
    if (isResubmitFlow) {
      resubmitAvailability(id, viewingAsUserId);
      toast.success(t.toast.availabilityResubmitted);
    } else {
      submitAvailability(id, viewingAsUserId);
      toast.success(t.toast.availabilitySubmitted);
    }
    navigateTo(getMeetingDetailPath(id));
  };

  const handleBack = () => {
    if (isResubmitFlow) {
      clearPendingAvailabilityResubmit();
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <AppLink
        href={staticHref(getMeetingDetailPath(id))}
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 min-h-[44px]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.availabilityPage.back}
      </AppLink>

      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
        {isResubmitFlow
          ? t.availabilityResubmit.pageTitle
          : t.availabilityPage.title}
      </h1>
      <p className="text-muted-foreground mb-6">
        {isResubmitFlow ? (
          t.availabilityResubmit.pageDescription
        ) : (
          <>
            <span className="md:hidden">{t.availabilityPage.hintMobile}</span>
            <span className="hidden md:inline">{t.availabilityPage.hintDesktop}</span>
            {t.availabilityPage.hintSuffix}
          </>
        )}
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{meeting.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityGrid
            slots={meeting.candidateSlots}
            availability={meeting.availability}
            userId={viewingAsUserId}
            dayLeavePresetsByUser={meeting.dayLeavePresetsByUser}
            onChange={(slotId, state) =>
              setAvailability(id, viewingAsUserId, slotId, state)
            }
            onDayLeaveChange={(date, preset) =>
              setDayLeavePreset(id, viewingAsUserId, date, preset)
            }
          />
        </CardContent>
      </Card>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-4 z-10">
        <Button className="w-full h-12 text-base" size="lg" onClick={handleSubmit}>
          {isResubmitFlow
            ? t.availabilityResubmit.submit
            : hasSubmittedAvailability
              ? t.meetings.editAvailability
              : t.availabilityPage.submit}
        </Button>
      </div>
    </div>
  );
}
