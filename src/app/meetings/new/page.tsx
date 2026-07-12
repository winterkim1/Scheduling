"use client";

import { useRef } from "react";
import { AppLink } from "@/components/app-link";
import { ArrowLeft } from "lucide-react";
import {
  CreateMeetingForm,
  type CreateMeetingFormHandle,
} from "@/components/meetings/create-meeting-form";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export default function NewMeetingPage() {
  const { t } = useI18n();
  const formRef = useRef<CreateMeetingFormHandle>(null);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <AppLink
        href="/meetings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.meetings.backToList}
      </AppLink>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight min-w-0">
          {t.meetings.createTitle}
        </h1>
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={() => formRef.current?.saveDraft()}
        >
          {t.createForm.saveDraft}
        </Button>
      </div>
      <CreateMeetingForm ref={formRef} />
    </div>
  );
}
