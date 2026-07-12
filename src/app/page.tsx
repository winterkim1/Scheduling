"use client";

import { AppLink } from "@/components/app-link";
import { motion } from "framer-motion";
import { AlertCircle, BarChart3, Bell, Calendar, FileText, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeetingCard } from "@/components/meetings/meeting-card";
import { DashboardSectionHeader } from "@/components/dashboard/section-header";
import { WeekSchedule } from "@/components/dashboard/week-schedule";
import {
  DashboardStatCard,
  dashboardStatIcons,
} from "@/components/dashboard/dashboard-stat-card";
import {
  getAwaitingConfirmationMeetings,
  getPendingResponseMeetings,
  getRecentMeetings,
} from "@/lib/dashboard-filters";
import { useShallow } from "zustand/react/shallow";
import { useMeetingStore } from "@/store/meeting-store";
import { getCurrentUser } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n";
import { isUpcomingMeeting } from "@/lib/meeting-utils";

export default function DashboardPage() {
  const meetings = useMeetingStore(useShallow((s) => s.getOrganizerMeetings()));
  const unreadCount = useMeetingStore(
    (s) => s.notifications.filter((notification) => !notification.read).length
  );
  const { locale, t } = useI18n();
  const user = getCurrentUser(locale);

  const pending = getPendingResponseMeetings(meetings);
  const awaitingConfirmation = getAwaitingConfirmationMeetings(meetings);
  const recent = getRecentMeetings(meetings);
  const upcoming = meetings.filter(isUpcomingMeeting);
  const changeRequests = meetings.filter((m) => m.status === "change_requested");

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t.dashboard.greeting(user.name)}
          </h1>
          <p className="text-muted-foreground mt-1">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <AppLink href="/meetings/new">
            <Button className="max-md:h-9 max-md:px-3 max-md:text-sm shrink-0">
              <Plus className="h-4 w-4" />
              {t.nav.newMeeting}
            </Button>
          </AppLink>
          <div className="flex items-center gap-2 ml-auto">
            <AppLink href="/notifications">
              <Button variant="outline" size="icon" aria-label={t.nav.notifications}>
                <span className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </span>
              </Button>
            </AppLink>
            <AppLink href="/settings" className="max-md:hidden">
              <Button variant="outline" size="icon" aria-label={t.nav.settings}>
                <Settings className="h-4 w-4" />
              </Button>
            </AppLink>
            <AppLink href="/analytics" className="md:hidden">
              <Button variant="outline" size="icon" aria-label={t.nav.analytics}>
                <BarChart3 className="h-4 w-4" />
              </Button>
            </AppLink>
            <AppLink href="/meetings/record" className="md:hidden">
              <Button
                variant="outline"
                className="h-9 bg-white hover:bg-white/90 dark:bg-background"
              >
                <FileText className="h-4 w-4" />
                {t.nav.recordMeeting}
              </Button>
            </AppLink>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-stretch">
        <DashboardStatCard
          title={t.dashboard.pendingResponses}
          count={pending.length}
          href="/dashboard/pending"
          variant="warning"
          icon={dashboardStatIcons.pending}
          subtitle={t.dashboard.viewDetails}
        />
        <DashboardStatCard
          title={t.dashboard.awaitingConfirmation}
          count={awaitingConfirmation.length}
          href="/dashboard/confirmation"
          variant="info"
          icon={dashboardStatIcons.confirmation}
          subtitle={t.dashboard.viewDetails}
        />
        <DashboardStatCard
          title={t.dashboard.recentMeetings}
          count={recent.length}
          href="/dashboard/recent"
          variant="purple"
          icon={dashboardStatIcons.recent}
          subtitle={t.dashboard.viewDetails}
        />
      </div>

      <WeekSchedule meetings={meetings} />

      <section>
        <DashboardSectionHeader
          title={t.dashboard.upcoming}
          href="/meetings"
          linkLabel={t.dashboard.viewAll}
          icon={
            <Calendar className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0" />
          }
        />
        <div className="space-y-3">
          {upcoming.length > 0 ? (
            upcoming.map((m) => <MeetingCard key={m.id} meeting={m} />)
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center rounded-lg border border-dashed">
              {t.dashboard.noUpcoming}
            </p>
          )}
        </div>
      </section>

      {changeRequests.length > 0 && (
        <section>
          <DashboardSectionHeader
            title={t.dashboard.changeRequests}
            icon={<AlertCircle className="h-5 w-5 text-destructive shrink-0" />}
          />
          <div className="space-y-3">
            {changeRequests.map((m) => (
              <MeetingCard key={m.id} meeting={m} showProgress={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
