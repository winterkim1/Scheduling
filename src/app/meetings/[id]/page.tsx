"use client";

import { use } from "react";
import { MeetingDetailView } from "@/components/meetings/meeting-detail-view";

export default function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <MeetingDetailView id={id} />;
}
