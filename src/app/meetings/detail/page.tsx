"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MeetingDetailView } from "@/components/meetings/meeting-detail-view";
import { useI18n } from "@/lib/i18n";
import { staticHref } from "@/lib/navigation";

function MeetingDetailQueryPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { t } = useI18n();

  if (!id) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{t.meetings.notFound}</p>
        <a href={staticHref("/meetings")} className="text-sm underline mt-2 inline-block">
          {t.meetings.backToList}
        </a>
      </div>
    );
  }

  return <MeetingDetailView id={id} />;
}

export default function MeetingDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      }
    >
      <MeetingDetailQueryPage />
    </Suspense>
  );
}
