"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatisticsCard } from "@/components/meetings/statistics-card";
import { useShallow } from "zustand/react/shallow";
import { useMeetingStore } from "@/store/meeting-store";
import { Clock, Users, TrendingUp, Target } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const monthlyMeetingCounts = [12, 15, 11, 18, 14, 16];
const trendValues = [2.4, 2.1, 2.8, 1.9, 1.7, 1.8];
const actionItemCompleted = [6, 8, 5, 9, 7, 10];
const actionItemInProgress = [3, 2, 4, 2, 3, 2];
const actionItemPending = [2, 1, 3, 1, 2, 1];

const ACTION_ITEM_COLORS = {
  completed: "#22c55e",
  inProgress: "#3b82f6",
  pending: "#eab308",
};

export default function AnalyticsPage() {
  const stats = useMeetingStore(useShallow((s) => s.getDashboardStats()));
  const { locale, t } = useI18n();

  const monthlyMeetingsData = useMemo(
    () =>
      t.analytics.months.map((month, i) => ({
        month,
        count: monthlyMeetingCounts[i],
      })),
    [t.analytics.months]
  );

  const trendData = useMemo(
    () =>
      t.analytics.months.map((month, i) => ({
        month,
        value: trendValues[i],
      })),
    [t.analytics.months]
  );

  const actionItemData = useMemo(
    () =>
      t.analytics.months.map((month, i) => ({
        month,
        completed: actionItemCompleted[i],
        inProgress: actionItemInProgress[i],
        pending: actionItemPending[i],
      })),
    [t.analytics.months]
  );

  const meetingTypeDistribution = useMemo(
    () => [
      { name: t.analytics.meetingTypeRegular, value: 40, color: "#22c55e" },
      { name: t.analytics.meetingTypeProject, value: 30, color: "#3b82f6" },
      { name: t.analytics.meetingTypeUrgent, value: 15, color: "#ef4444" },
      { name: t.analytics.meetingTypeWorkshop, value: 15, color: "#eab308" },
    ],
    [t.analytics]
  );

  const confirmationValue =
    locale === "ko"
      ? `${stats.averageConfirmationTime}일 · 52분`
      : `${stats.averageConfirmationTime} days · 52 min`;

  const agendaAnalysisValue =
    locale === "ko"
      ? `24${t.analytics.agendaCountUnit}`
      : `24 ${t.analytics.agendaCountUnit}`;

  const performanceValue = "87%";

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.analytics.title}</h1>
        <p className="text-muted-foreground mt-1">{t.analytics.subtitle}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 items-stretch">
        <StatisticsCard
          title={t.analytics.avgConfirmation}
          value={confirmationValue}
          icon={Clock}
          trend={{ value: 15, label: t.common.faster }}
        />
        <StatisticsCard
          title={t.analytics.avgAttendance}
          value={`${stats.averageAttendance}%`}
          icon={Users}
          trend={{ value: 5, label: t.common.improvement }}
        />
        <StatisticsCard
          title={t.analytics.firstPickAdoption}
          value={agendaAnalysisValue}
          icon={Target}
          trend={{ value: 8, label: t.common.improvement }}
        />
        <StatisticsCard
          title={t.analytics.totalMeetings}
          value={performanceValue}
          subtitle={t.analytics.performanceScore}
          icon={TrendingUp}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.analytics.monthlyMeetings}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyMeetingsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#171717" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.analytics.trendAnalysis}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#171717"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.analytics.actionItems}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={actionItemData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="completed"
                  stackId="action"
                  fill={ACTION_ITEM_COLORS.completed}
                  name={t.analytics.actionItemCompleted}
                />
                <Bar
                  dataKey="inProgress"
                  stackId="action"
                  fill={ACTION_ITEM_COLORS.inProgress}
                  name={t.analytics.actionItemInProgress}
                />
                <Bar
                  dataKey="pending"
                  stackId="action"
                  fill={ACTION_ITEM_COLORS.pending}
                  name={t.analytics.actionItemPending}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.analytics.statusDistribution}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={meetingTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {meetingTypeDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
