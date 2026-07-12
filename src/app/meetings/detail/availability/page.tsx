"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MeetingAvailabilityView } from "@/components/meetings/meeting-availability-view";
import { useI18n } from "@/lib/i18n";

function MeetingAvailabilityQueryPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { t } = useI18n();

  if (!id) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{t.meetings.notFound}</p>
      </div>
    );
  }

  return <MeetingAvailabilityView id={id} />;
}

export default function MeetingAvailabilityPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      }
    >
      <MeetingAvailabilityQueryPage />
    </Suspense>
  );
}
