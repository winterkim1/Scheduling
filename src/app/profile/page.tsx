"use client";

import { motion } from "framer-motion";
import { AppLink } from "@/components/app-link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CURRENT_USER_ID, getCurrentUser, getUserById, getUsers } from "@/lib/mock-data";
import { formatUserAffiliation } from "@/lib/user-utils";
import { getInitials, cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { useMeetingStore } from "@/store/meeting-store";
import { useMeetingStoreHydrated } from "@/lib/use-store-hydration";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Settings,
  LogOut,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ProfilePage() {
  const { locale, t } = useI18n();
  const hydrated = useMeetingStoreHydrated();
  const organizer = getCurrentUser(locale);
  const users = getUsers(locale);
  const viewingAsUserId = useMeetingStore((s) => s.viewingAsUserId);
  const setViewingAs = useMeetingStore((s) => s.setViewingAs);
  const organizerMeetings = useMeetingStore(
    useShallow((s) => s.getOrganizerMeetings())
  );
  const inviteeMeetings = useMeetingStore(
    useShallow((s) => s.getInviteeMeetings(viewingAsUserId))
  );

  const isViewingSelf = viewingAsUserId === CURRENT_USER_ID;
  const displayUser =
    getUserById(viewingAsUserId, locale) ?? organizer;
  const statsMeetings = isViewingSelf ? organizerMeetings : inviteeMeetings;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <Avatar className="h-20 w-20 mx-auto mb-4">
          <AvatarFallback className="text-xl bg-primary text-primary-foreground">
            {getInitials(displayUser.name)}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold">
          {displayUser.name}{" "}
          <span className="text-base text-muted-foreground font-normal">
            {formatUserAffiliation(displayUser)}
          </span>
        </h1>
        <p className="text-muted-foreground">{displayUser.email}</p>
        {!isViewingSelf && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
            {t.profile.viewingAsHint(displayUser.name)}
          </p>
        )}
      </motion.div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {hydrated ? statsMeetings.length : "–"}
            </p>
            <p className="text-xs text-muted-foreground">{t.profile.meetings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {hydrated
                ? statsMeetings.filter((m) => m.status === "confirmed").length
                : "–"}
            </p>
            <p className="text-xs text-muted-foreground">{t.profile.confirmed}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4 md:hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t.profile.quickLinks}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <AppLink href="/">
            <Button variant="outline" className="w-full justify-start">
              <LayoutDashboard className="h-4 w-4" />
              {t.nav.dashboard}
            </Button>
          </AppLink>
          <AppLink href="/analytics">
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="h-4 w-4" />
              {t.nav.analytics}
            </Button>
          </AppLink>
          <AppLink href="/meetings/record">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4" />
              {t.nav.recordMeeting}
            </Button>
          </AppLink>
          <AppLink href="/settings">
            <Button variant="outline" className="w-full justify-start">
              <Settings className="h-4 w-4" />
              {t.nav.settings}
            </Button>
          </AppLink>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t.profile.viewAs}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button
            type="button"
            onClick={() => setViewingAs(CURRENT_USER_ID)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
              isViewingSelf
                ? "border-primary bg-primary/5"
                : "hover:bg-accent"
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(organizer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium">{organizer.name}</p>
              <p className="text-xs text-muted-foreground">{t.profile.viewAsSelf}</p>
            </div>
          </button>
          {users
            .filter((u) => u.id !== CURRENT_USER_ID)
            .map((u) => {
              const selected = viewingAsUserId === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setViewingAs(u.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                    selected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </p>
                  </div>
                </button>
              );
            })}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <AppLink href="/settings" className="hidden md:block">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="h-4 w-4" />
            {t.nav.settings}
          </Button>
        </AppLink>
        <Button variant="ghost" className="w-full justify-start text-destructive">
          <LogOut className="h-4 w-4" />
          {t.profile.signOut}
        </Button>
      </div>
    </div>
  );
}
