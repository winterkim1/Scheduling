"use client";

import { use } from "react";
import { MeetingAvailabilityView } from "@/components/meetings/meeting-availability-view";

export default function AvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <MeetingAvailabilityView id={id} />;
}
