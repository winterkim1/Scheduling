"use client";

import { AppLink } from "@/components/app-link";
import { ArrowLeft } from "lucide-react";
import { CreateMeetingForm } from "@/components/meetings/create-meeting-form";
import { useI18n } from "@/lib/i18n";

export default function NewMeetingPage() {
  const { t } = useI18n();

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <AppLink
        href="/meetings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.meetings.backToList}
      </AppLink>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
        {t.meetings.createTitle}
      </h1>
      <CreateMeetingForm />
    </div>
  );
}
