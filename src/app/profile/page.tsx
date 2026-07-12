"use client";

import { motion } from "framer-motion";
import { AppLink } from "@/components/app-link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getUsers } from "@/lib/mock-data";
import { formatUserAffiliation } from "@/lib/user-utils";
import { getInitials } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { useMeetingStore } from "@/store/meeting-store";
import { Settings, LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ProfilePage() {
  const { locale, t } = useI18n();
  const user = getCurrentUser(locale);
  const users = getUsers(locale);
  const inviteeMeetings = useMeetingStore(
    useShallow((s) => s.getInviteeMeetings(user.id))
  );
  const setViewingAs = useMeetingStore((s) => s.setViewingAs);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <Avatar className="h-20 w-20 mx-auto mb-4">
          <AvatarFallback className="text-xl bg-primary text-primary-foreground">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold">
          {user.name}{" "}
          <span className="text-base text-muted-foreground font-normal">
            {formatUserAffiliation(user)}
          </span>
        </h1>
        <p className="text-muted-foreground">{user.email}</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{inviteeMeetings.length}</p>
            <p className="text-xs text-muted-foreground">{t.profile.meetings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {inviteeMeetings.filter((m) => m.status === "confirmed").length}
            </p>
            <p className="text-xs text-muted-foreground">{t.profile.confirmed}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t.profile.viewAs}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users
            .filter((u) => u.id !== user.id)
            .map((u) => (
              <button
                key={u.id}
                onClick={() => setViewingAs(u.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(u.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              </button>
            ))}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <AppLink href="/settings">
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
