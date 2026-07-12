"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, animate, type PanInfo } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { X, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMeetingDetailPath } from "@/lib/meeting-routes";
import { getNotificationIconStyles } from "@/lib/notification-styles";
import {
  isPreferredNotConfirmationNotification,
} from "@/lib/preferred-not-confirmation";
import { navigateTo } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Notification } from "@/types";

const SWIPE_DELETE_THRESHOLD = 80;
const LONG_PRESS_MS = 500;

interface NotificationCardProps {
  notification: Notification;
  icon: LucideIcon;
  onDelete: (id: string) => void;
  onRead?: (id: string) => void;
  onMarkUnread?: (id: string) => void;
  onPreferredNotConfirm?: (notification: Notification) => void;
}

function clampMenuPosition(x: number, y: number) {
  const menuWidth = 180;
  const menuHeight = 44;
  const padding = 8;
  const maxX = window.innerWidth - menuWidth - padding;
  const maxY = window.innerHeight - menuHeight - padding;

  return {
    x: Math.max(padding, Math.min(x, maxX)),
    y: Math.max(padding, Math.min(y, maxY)),
  };
}

export function NotificationCard({
  notification,
  icon: Icon,
  onDelete,
  onRead,
  onMarkUnread,
  onPreferredNotConfirm,
}: NotificationCardProps) {
  const { locale, t } = useI18n();
  const dateLocale = locale === "ko" ? ko : enUS;
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const x = useMotionValue(0);
  const iconStyles = getNotificationIconStyles(notification.type);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const canMarkUnread = Boolean(onMarkUnread && notification.read);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const closeMenu = () => setMenuOpen(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [menuOpen]);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const openMarkUnreadMenu = (clientX: number, clientY: number) => {
    if (!canMarkUnread) return;
    longPressTriggeredRef.current = true;
    setMenuPosition(clampMenuPosition(clientX, clientY));
    setMenuOpen(true);
  };

  const handleMarkUnread = () => {
    onMarkUnread?.(notification.id);
    setMenuOpen(false);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isMobile) return;

    if (info.offset.x < -SWIPE_DELETE_THRESHOLD) {
      animate(x, -320, {
        duration: 0.2,
        onComplete: () => onDelete(notification.id),
      });
      return;
    }

    animate(x, 0, { type: "spring", stiffness: 500, damping: 32 });
  };

  const handleOpenMeeting = () => {
    if (!notification.meetingId) return;

    if (isPreferredNotConfirmationNotification(notification)) {
      onPreferredNotConfirm?.(notification);
      return;
    }

    navigateTo(getMeetingDetailPath(notification.meetingId));
  };

  const opensMeeting =
    Boolean(notification.meetingId) &&
    (isPreferredNotConfirmationNotification(notification)
      ? Boolean(onPreferredNotConfirm)
      : true);

  const card = (
    <Card
      className={cn(
        "relative bg-card transition-shadow select-none",
        notification.meetingId && opensMeeting && "cursor-pointer hover:shadow-md",
        onRead && !opensMeeting && "cursor-pointer hover:shadow-md",
        canMarkUnread && "cursor-context-menu",
        !notification.read && "border-border shadow-sm",
        notification.read && "opacity-60"
      )}
      onClick={() => {
        if (longPressTriggeredRef.current) {
          longPressTriggeredRef.current = false;
          return;
        }
        onRead?.(notification.id);
        if (opensMeeting) {
          handleOpenMeeting();
        }
      }}
      onContextMenu={(event) => {
        if (!canMarkUnread) return;
        event.preventDefault();
        openMarkUnreadMenu(event.clientX, event.clientY);
      }}
      onTouchStart={(event) => {
        if (!canMarkUnread) return;
        longPressTriggeredRef.current = false;
        const touch = event.touches[0];
        clearLongPressTimer();
        longPressTimerRef.current = setTimeout(() => {
          openMarkUnreadMenu(touch.clientX, touch.clientY);
        }, LONG_PRESS_MS);
      }}
      onTouchMove={() => clearLongPressTimer()}
      onTouchEnd={() => clearLongPressTimer()}
      onTouchCancel={() => clearLongPressTimer()}
    >
      <CardContent className="p-4 flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
            iconStyles.container
          )}
        >
          <Icon className={cn("h-4 w-4", iconStyles.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{notification.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {notification.message}
          </p>
          {notification.footnote && (
            <p className="text-xs mt-1">
              {notification.footnote.startsWith("*") ? (
                <>
                  <span className="text-muted-foreground">*</span>
                  <span className="text-muted-foreground/50">
                    {notification.footnote.slice(1)}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground/50">
                  {notification.footnote}
                </span>
              )}
            </p>
          )}
          {!notification.read && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </p>
          )}
        </div>
        {opensMeeting && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onRead?.(notification.id);
              handleOpenMeeting();
            }}
          >
            {t.common.view}
          </Button>
        )}
        <button
          type="button"
          className="hidden md:flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(notification.id);
          }}
          aria-label={t.notifications.delete}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </CardContent>
    </Card>
  );

  const menu =
    menuOpen && mounted
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label={t.common.cancel}
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="fixed z-50 min-w-[11rem] rounded-md border bg-popover p-1 shadow-md"
              style={{ left: menuPosition.x, top: menuPosition.y }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="flex w-full items-center rounded-sm px-3 py-2 text-sm hover:bg-muted"
                onClick={handleMarkUnread}
              >
                {t.notifications.markUnread}
              </button>
            </div>
          </>,
          document.body
        )
      : null;

  const cardContent = !isMobile ? (
    card
  ) : (
    <div className="relative overflow-hidden rounded-xl">
      <div
        className="absolute inset-y-0 right-0 left-0 flex items-center justify-end rounded-xl bg-muted px-4"
        aria-hidden
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </div>
      <motion.div
        className="relative bg-card"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -160, right: 0 }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
      >
        {card}
      </motion.div>
    </div>
  );

  return (
    <>
      {cardContent}
      {menu}
    </>
  );
}
