"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const LONG_PRESS_MS = 520;

interface CalendarDayActionShellProps {
  enabled: boolean;
  selected: boolean;
  showActions: boolean;
  canRegister: boolean;
  canEditDelete: boolean;
  className?: string;
  children: React.ReactNode;
  onSelect: () => void;
  onShowActions: () => void;
  onRegister: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CalendarDayActionShell({
  enabled,
  selected,
  showActions,
  canRegister,
  canEditDelete,
  className,
  children,
  onSelect,
  onShowActions,
  onRegister,
  onEdit,
  onDelete,
}: CalendarDayActionShellProps) {
  const { t } = useI18n();
  const timerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  if (!enabled) {
    return (
      <button type="button" className={className} onClick={onSelect}>
        {children}
      </button>
    );
  }

  return (
    <div className="relative">
      {showActions && (canRegister || canEditDelete) && (
        <div className="absolute bottom-full left-1/2 z-30 mb-1 flex -translate-x-1/2 gap-1 whitespace-nowrap">
          {canRegister && (
            <Button
              type="button"
              size="sm"
              className="h-7 px-2 text-[11px] shadow-md"
              onClick={(event) => {
                event.stopPropagation();
                onRegister();
              }}
            >
              {t.calendar.registerEvent}
            </Button>
          )}
          {canEditDelete && (
            <>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 px-2 text-[11px] shadow-md"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}
              >
                {t.calendar.editEvent}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="h-7 px-2 text-[11px] shadow-md"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
              >
                {t.calendar.deleteEvent}
              </Button>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        aria-pressed={selected}
        className={cn(className, showActions && "relative z-20")}
        onClick={() => {
          if (longPressTriggeredRef.current) {
            longPressTriggeredRef.current = false;
            return;
          }
          onSelect();
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          onSelect();
          onShowActions();
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          longPressTriggeredRef.current = false;
          clearTimer();
          timerRef.current = window.setTimeout(() => {
            longPressTriggeredRef.current = true;
            onSelect();
            onShowActions();
          }, LONG_PRESS_MS);
        }}
        onPointerUp={clearTimer}
        onPointerLeave={clearTimer}
        onPointerCancel={clearTimer}
        onContextMenu={(event) => event.preventDefault()}
      >
        {children}
      </button>
    </div>
  );
}
