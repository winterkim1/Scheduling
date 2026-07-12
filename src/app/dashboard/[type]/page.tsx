"use client";

import { use } from "react";
import { AppLink } from "@/components/app-link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { MeetingCard } from "@/components/meetings/meeting-card";
import { useShallow } from "zustand/react/shallow";
import { useMeetingStore } from "@/store/meeting-store";
import { useI18n } from "@/lib/i18n";
import {
  DASHBOARD_LIST_TYPES,
  getDashboardMeetings,
  type DashboardListType,
} from "@/lib/dashboard-filters";
import { dashboardStatIcons } from "@/components/dashboard/dashboard-stat-card";
import { cn } from "@/lib/utils";

const variantStyles = {
  pending: "text-yellow-700 dark:text-yellow-400",
  confirmation: "text-blue-700 dark:text-blue-400",
  recent: "text-purple-700 dark:text-purple-400",
} as const;

export default function DashboardDetailPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);
  const listType = type as DashboardListType;
  const meetings = useMeetingStore(useShallow((s) => s.getOrganizerMeetings()));
  const { t } = useI18n();

  if (!DASHBOARD_LIST_TYPES.includes(listType)) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{t.dashboard.notFound}</p>
        <AppLink href="/" className="text-sm underline mt-2 inline-block">
          {t.dashboard.backToDashboard}
        </AppLink>
      </div>
    );
  }

  const items = getDashboardMeetings(meetings, listType);
  const Icon = dashboardStatIcons[listType];

  const meta = {
    pending: {
      title: t.dashboard.pendingResponses,
      empty: t.dashboard.allCaughtUp,
      showProgress: true,
    },
    confirmation: {
      title: t.dashboard.awaitingConfirmation,
      empty: t.dashboard.nonePending,
      showProgress: true,
    },
    recent: {
      title: t.dashboard.recentMeetings,
      empty: t.dashboard.noRecentMeetings,
      showProgress: false,
    },
  }[listType];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <AppLink
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.dashboard.backToDashboard}
      </AppLink>

      <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg bg-muted",
              variantStyles[listType]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {meta.title}
            </h1>
            <p className="text-muted-foreground mt-0.5">
              {t.dashboard.itemCount(items.length)}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((m) => (
            <MeetingCard
              key={m.id}
              meeting={m}
              showProgress={meta.showProgress}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-12 text-center rounded-lg border border-dashed">
            {meta.empty}
          </p>
        )}
      </div>
    </div>
  );
}
