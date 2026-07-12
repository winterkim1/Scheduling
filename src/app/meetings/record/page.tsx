"use client";

import { Suspense } from "react";
import { AppLink } from "@/components/app-link";
import { ArrowLeft } from "lucide-react";
import { MeetingRecordForm } from "@/components/meetings/meeting-record-form";
import { useI18n } from "@/lib/i18n";

function MeetingRecordPageContent() {
  const { t } = useI18n();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
      <AppLink
        href="/meetings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.meetings.backToList}
      </AppLink>
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t.meetingRecord.title}
        </h1>
        <p className="text-muted-foreground mt-1">{t.meetingRecord.subtitle}</p>
      </div>
      <MeetingRecordForm />
    </div>
  );
}

export default function MeetingRecordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <MeetingRecordPageContent />
    </Suspense>
  );
}
