"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Calendar,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
} from "lucide-react";
import { NotificationCard } from "@/components/notifications/notification-card";
import { PreferredNotConfirmationDialog } from "@/components/meetings/preferred-not-confirmation-dialog";
import { sortNotificationsByCreatedAtDesc } from "@/lib/notification-utils";
import {
  type PreferredNotConfirmationPending,
} from "@/lib/preferred-not-confirmation";
import { MEETING_7_PREFERRED_NOT_SEEDS } from "@/lib/demo-data";
import { useMeetingStore } from "@/store/meeting-store";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import type { Notification } from "@/types";

const typeIcons = {
  invitation: Mail,
  reminder: Bell,
  confirmation_required: AlertTriangle,
  meeting_confirmed: CheckCircle,
  meeting_changed: Calendar,
  change_request: AlertTriangle,
  re_matching: RefreshCw,
};

function NotificationList({
  items,
  onDelete,
  onRead,
  onMarkUnread,
  onPreferredNotConfirm,
}: {
  items: Notification[];
  onDelete: (id: string) => void;
  onRead?: (id: string) => void;
  onMarkUnread?: (id: string) => void;
  onPreferredNotConfirm?: (notification: Notification) => void;
}) {
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((notif) => {
          const Icon = typeIcons[notif.type];
          return (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -48, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
            >
              <NotificationCard
                notification={notif}
                icon={Icon}
                onDelete={onDelete}
                onRead={onRead}
                onMarkUnread={onMarkUnread}
                onPreferredNotConfirm={onPreferredNotConfirm}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default function NotificationsPage() {
  const notifications = useMeetingStore((s) => s.notifications);
  const getMeeting = useMeetingStore((s) => s.getMeeting);
  const viewingAsUserId = useMeetingStore((s) => s.viewingAsUserId);
  const respondToPreferredNotConfirmation = useMeetingStore(
    (s) => s.respondToPreferredNotConfirmation
  );
  const markRead = useMeetingStore((s) => s.markNotificationRead);
  const markUnread = useMeetingStore((s) => s.markNotificationUnread);
  const deleteNotification = useMeetingStore((s) => s.deleteNotification);
  const { t } = useI18n();
  const [preferredNotDialog, setPreferredNotDialog] = useState<{
    pending: PreferredNotConfirmationPending;
    meeting: NonNullable<ReturnType<typeof getMeeting>>;
  } | null>(null);

  const preferredNotPending = preferredNotDialog?.pending ?? null;
  const preferredNotMeeting = preferredNotDialog?.meeting;
  const preferredNotDialogOpen = Boolean(preferredNotDialog);

  const handlePreferredNotConfirm = (notification: Notification) => {
    if (!notification.meetingId) return;
    const meeting = getMeeting(notification.meetingId);
    if (!meeting) return;

    const seed = MEETING_7_PREFERRED_NOT_SEEDS[0];
    const pending: PreferredNotConfirmationPending = {
      meetingId: notification.meetingId,
      userId: viewingAsUserId,
      notificationId: notification.id,
      slotDate: seed.date,
      slotTime: seed.time,
    };

    setPreferredNotDialog({ pending, meeting });
  };

  const handlePreferredNotOpenChange = (open: boolean) => {
    if (!open) setPreferredNotDialog(null);
  };

  const handlePreferredNotAccept = () => {
    if (!preferredNotPending) return;
    respondToPreferredNotConfirmation(
      preferredNotPending.meetingId,
      preferredNotPending.userId,
      true,
      preferredNotPending.slotDate,
      preferredNotPending.slotTime
    );
    handlePreferredNotOpenChange(false);
    toast.success(t.toast.preferredNotAccepted);
  };

  const handlePreferredNotDecline = () => {
    if (!preferredNotPending) return;
    respondToPreferredNotConfirmation(
      preferredNotPending.meetingId,
      preferredNotPending.userId,
      false,
      preferredNotPending.slotDate,
      preferredNotPending.slotTime
    );
    handlePreferredNotOpenChange(false);
    toast.info(t.toast.preferredNotDeclined);
  };

  const unread = useMemo(
    () =>
      sortNotificationsByCreatedAtDesc(
        notifications.filter((notification) => !notification.read)
      ),
    [notifications]
  );
  const read = useMemo(
    () =>
      sortNotificationsByCreatedAtDesc(
        notifications.filter((notification) => notification.read)
      ),
    [notifications]
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t.notifications.title}
        </h1>
        <p className="text-muted-foreground mt-1">{t.notifications.unread(unread.length)}</p>
      </motion.div>

      {unread.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {t.notifications.new}
          </h2>
          <NotificationList
            items={unread}
            onDelete={deleteNotification}
            onRead={markRead}
            onPreferredNotConfirm={handlePreferredNotConfirm}
          />
        </section>
      )}

      {read.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {t.notifications.read}
          </h2>
          <NotificationList
            items={read}
            onDelete={deleteNotification}
            onMarkUnread={markUnread}
            onPreferredNotConfirm={handlePreferredNotConfirm}
          />
        </section>
      )}

      {notifications.length === 0 && (
        <p className="text-center text-muted-foreground py-12">{t.notifications.empty}</p>
      )}

      <PreferredNotConfirmationDialog
        open={preferredNotDialogOpen}
        meeting={preferredNotMeeting}
        onOpenChange={handlePreferredNotOpenChange}
        onAccept={handlePreferredNotAccept}
        onDecline={handlePreferredNotDecline}
      />
    </div>
  );
}
