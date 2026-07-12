"use client";

import { motion } from "framer-motion";
import { Moon, Sun, Bell, Calendar, MessageSquare, Languages, AlarmClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMeetingStore } from "@/store/meeting-store";
import { getCurrentUser } from "@/lib/mock-data";
import { formatUserAffiliation } from "@/lib/user-utils";
import { useI18n } from "@/lib/i18n";
import { RESPONSE_REMINDER_INTERVALS } from "@/types";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const darkMode = useMeetingStore((s) => s.darkMode);
  const toggleDarkMode = useMeetingStore((s) => s.toggleDarkMode);
  const responseReminderSettings = useMeetingStore((s) => s.responseReminderSettings);
  const toggleResponseReminder = useMeetingStore((s) => s.toggleResponseReminder);
  const toggleResponseReminderInterval = useMeetingStore(
    (s) => s.toggleResponseReminderInterval
  );
  const { locale, t, setLocale } = useI18n();
  const user = getCurrentUser(locale);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.settings.title}</h1>
        <p className="text-muted-foreground mt-1">{t.settings.subtitle}</p>
      </motion.div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.settings.profile}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-semibold">
                {user.name.slice(0, 1)}
              </div>
              <div>
                <p className="font-medium">
                  {user.name}{" "}
                  <span className="text-sm text-muted-foreground font-normal">
                    {formatUserAffiliation(user)}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.settings.language}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Languages className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{t.settings.language}</p>
                  <p className="text-xs text-muted-foreground">{t.settings.languageHint}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={locale === "ko" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocale("ko")}
                >
                  {t.settings.korean}
                </Button>
                <Button
                  variant={locale === "en" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocale("en")}
                >
                  {t.settings.english}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.settings.appearance}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-sm">{t.settings.darkMode}</p>
                  <p className="text-xs text-muted-foreground">{t.settings.darkModeHint}</p>
                </div>
              </div>
              <Button
                variant={darkMode ? "default" : "outline"}
                size="sm"
                onClick={toggleDarkMode}
              >
                {darkMode ? t.common.on : t.common.off}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.settings.notifications}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: Bell, label: t.settings.emailNotif, enabled: true },
              { icon: Calendar, label: t.settings.calendarReminder, enabled: true },
              { icon: MessageSquare, label: t.settings.slackNotif, enabled: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
                <Button variant={item.enabled ? "default" : "outline"} size="sm">
                  {item.enabled ? t.common.on : t.common.off}
                </Button>
              </div>
            ))}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <AlarmClock className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t.settings.responseReminder}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.settings.responseReminderHint}
                    </p>
                  </div>
                </div>
                <Button
                  variant={responseReminderSettings.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleResponseReminder}
                >
                  {responseReminderSettings.enabled ? t.common.on : t.common.off}
                </Button>
              </div>

              {responseReminderSettings.enabled && (
                <div className="ml-8 space-y-2.5 border-l pl-4">
                  {RESPONSE_REMINDER_INTERVALS.map((interval) => {
                    const checked = responseReminderSettings.intervals.includes(interval);
                    return (
                      <label
                        key={interval}
                        className="flex items-center gap-2.5 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleResponseReminderInterval(interval)}
                          className={cn(
                            "h-4 w-4 rounded border border-input accent-primary",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          )}
                        />
                        <span className={checked ? "font-medium" : "text-muted-foreground"}>
                          {t.settings.responseReminderIntervals[interval]}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">{t.settings.integrations}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">{t.settings.googleCalendar}</p>
                <p className="text-xs text-muted-foreground">{t.settings.googleCalendarHint}</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                {t.common.connect}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">{t.settings.slack}</p>
                <p className="text-xs text-muted-foreground">{t.settings.slackHint}</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                {t.common.connect}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
