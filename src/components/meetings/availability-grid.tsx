"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cycleAvailabilityState } from "@/lib/slot-utils";
import { getAvailabilityForUser } from "@/lib/matching-engine";
import type { TimeSlot, AvailabilityEntry, AvailabilityState, DayLeavePreset } from "@/types";
import { cn } from "@/lib/utils";
import { groupSlotsByDate } from "@/lib/slot-utils";
import { getUserDayLeavePreset } from "@/lib/day-leave-utils";
import { useI18n } from "@/lib/i18n";

const stateStyles: Record<AvailabilityState, string> = {
  available:
    "bg-green-100 border-green-300 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400",
  preferred_not:
    "bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-400",
  unavailable:
    "bg-red-100 border-red-300 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400",
};

interface AvailabilityGridProps {
  slots: TimeSlot[];
  availability: AvailabilityEntry[];
  userId: string;
  dayLeavePresetsByUser?: Record<string, Record<string, DayLeavePreset>>;
  onChange: (slotId: string, state: AvailabilityState) => void;
  onDayLeaveChange: (date: string, preset: DayLeavePreset) => void;
}

function Legend({ hint }: { hint: string }) {
  const { t } = useI18n();
  const stateLabels: Record<AvailabilityState, string> = {
    available: t.availability.available,
    preferred_not: t.availability.preferredNot,
    unavailable: t.availability.unavailable,
  };

  return (
    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs mb-4 md:mb-6">
      {(["available", "preferred_not", "unavailable"] as AvailabilityState[]).map(
        (state) => (
          <div key={state} className="flex items-center gap-1.5">
            <div
              className={cn(
                "h-3 w-3 rounded-sm border",
                state === "available" && "bg-green-400 border-green-500",
                state === "preferred_not" && "bg-yellow-400 border-yellow-500",
                state === "unavailable" && "bg-red-400 border-red-500"
              )}
            />
            <span className="text-muted-foreground">{stateLabels[state]}</span>
          </div>
        )
      )}
      <span className="text-muted-foreground w-full md:w-auto md:ml-auto">{hint}</span>
    </div>
  );
}

function useAvailabilityPaint(
  availability: AvailabilityEntry[],
  userId: string,
  onChange: (slotId: string, state: AvailabilityState) => void
) {
  const isPaintingRef = useRef(false);
  const paintStateRef = useRef<AvailabilityState | null>(null);
  const paintedRef = useRef(new Set<string>());
  const didDragRef = useRef(false);
  const pointerDownSlotRef = useRef<string | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const availabilityRef = useRef(availability);
  const userIdRef = useRef(userId);
  const onChangeRef = useRef(onChange);

  availabilityRef.current = availability;
  userIdRef.current = userId;
  onChangeRef.current = onChange;

  const getSlotIdFromPoint = (clientX: number, clientY: number) => {
    const element = document.elementFromPoint(clientX, clientY);
    return element?.closest<HTMLElement>("[data-slot-id]")?.dataset.slotId ?? null;
  };

  const applyPaint = useCallback((slotId: string) => {
    if (!isPaintingRef.current || paintStateRef.current === null) return;
    if (paintedRef.current.has(slotId)) return;

    paintedRef.current.add(slotId);
    if (slotId !== pointerDownSlotRef.current) {
      didDragRef.current = true;
    }

    const current = getAvailabilityForUser(
      availabilityRef.current,
      userIdRef.current,
      slotId
    );
    if (current !== paintStateRef.current) {
      onChangeRef.current(slotId, paintStateRef.current);
    }
  }, []);

  const endPaint = useCallback(() => {
    if (!isPaintingRef.current) return;

    const slotId = pointerDownSlotRef.current;
    // Tap only: advance one step. Drag keeps the starting cell's current state.
    if (!didDragRef.current && slotId) {
      const current = getAvailabilityForUser(
        availabilityRef.current,
        userIdRef.current,
        slotId
      );
      onChangeRef.current(slotId, cycleAvailabilityState(current));
    }

    isPaintingRef.current = false;
    paintStateRef.current = null;
    paintedRef.current.clear();
    didDragRef.current = false;
    pointerDownSlotRef.current = null;
    pointerIdRef.current = null;
    startPointRef.current = null;
    document.body.style.touchAction = "";
  }, []);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!isPaintingRef.current) return;
      if (
        pointerIdRef.current !== null &&
        event.pointerId !== pointerIdRef.current
      ) {
        return;
      }

      const start = startPointRef.current;
      if (start) {
        const moved =
          Math.abs(event.clientX - start.x) > 6 ||
          Math.abs(event.clientY - start.y) > 6;
        if (moved) {
          didDragRef.current = true;
        }
      }

      if (!didDragRef.current) return;

      if (event.cancelable) {
        event.preventDefault();
      }

      // Paint the starting cell's current state onto slots under the finger.
      if (pointerDownSlotRef.current) {
        applyPaint(pointerDownSlotRef.current);
      }
      const slotId = getSlotIdFromPoint(event.clientX, event.clientY);
      if (slotId) {
        applyPaint(slotId);
      }
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (
        pointerIdRef.current !== null &&
        event.pointerId !== pointerIdRef.current
      ) {
        return;
      }
      endPaint();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [applyPaint, endPaint]);

  const handlePointerDown = useCallback(
    (slotId: string, event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();

      const current = getAvailabilityForUser(
        availabilityRef.current,
        userIdRef.current,
        slotId
      );

      // Drag paints this current state; tap (no drag) cycles on pointer up.
      isPaintingRef.current = true;
      paintStateRef.current = current;
      paintedRef.current = new Set();
      didDragRef.current = false;
      pointerDownSlotRef.current = slotId;
      pointerIdRef.current = event.pointerId;
      startPointRef.current = { x: event.clientX, y: event.clientY };
      document.body.style.touchAction = "none";

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    },
    []
  );

  return { handlePointerDown };
}

interface DayLeaveSelectorProps {
  date: string;
  activePreset?: DayLeavePreset;
  onChange: (date: string, preset: DayLeavePreset) => void;
}

function DayLeaveSelector({ date, activePreset, onChange }: DayLeaveSelectorProps) {
  const { t } = useI18n();

  const presets: { id: DayLeavePreset; label: string }[] = [
    { id: "full_day", label: t.dayLeave.fullDay },
    { id: "morning_half", label: t.dayLeave.morningHalf },
    { id: "afternoon_half", label: t.dayLeave.afternoonHalf },
  ];

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() =>
            onChange(date, activePreset === preset.id ? "none" : preset.id)
          }
          className={cn(
            "text-xs sm:text-sm px-3 py-2 min-h-[44px] rounded-md border transition-colors",
            activePreset === preset.id
              ? "bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

interface SlotButtonProps {
  slot: TimeSlot;
  state: AvailabilityState;
  stateLabel: string;
  timeLabel: string;
  endTimeLabel?: string;
  layout: "mobile" | "desktop";
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
}

function SlotButton({
  slot,
  state,
  stateLabel,
  timeLabel,
  endTimeLabel,
  layout,
  onPointerDown,
}: SlotButtonProps) {
  const { t } = useI18n();

  if (layout === "mobile") {
    return (
      <motion.button
        type="button"
        data-slot-id={slot.id}
        whileTap={{ scale: 0.98 }}
        onPointerDown={onPointerDown}
        className={cn(
          "w-full p-4 min-h-[72px] rounded-xl border-2 text-left transition-colors touch-target select-none touch-none",
          stateStyles[state]
        )}
        aria-label={`${timeLabel} - ${stateLabel}. ${t.availability.tapToChange}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-base">{timeLabel}</p>
            {endTimeLabel && (
              <p className="text-xs opacity-75">
                {endTimeLabel}
                {t.availability.to}
              </p>
            )}
          </div>
          <span className="text-sm font-medium">{stateLabel}</span>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      data-slot-id={slot.id}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onPointerDown={onPointerDown}
      className={cn(
        "p-3 min-h-[64px] rounded-lg border-2 text-center transition-colors select-none touch-none",
        stateStyles[state]
      )}
      aria-label={`${timeLabel} - ${stateLabel}`}
    >
      <p className="text-sm font-semibold">{timeLabel}</p>
      <p className="text-[10px] mt-0.5 opacity-75">{stateLabel}</p>
    </motion.button>
  );
}

export function AvailabilityGrid({
  slots,
  availability,
  userId,
  dayLeavePresetsByUser,
  onChange,
  onDayLeaveChange,
}: AvailabilityGridProps) {
  const { t, formatDate, formatTime } = useI18n();
  const grouped = groupSlotsByDate(slots);
  const { handlePointerDown } = useAvailabilityPaint(
    availability,
    userId,
    onChange
  );

  const stateLabels: Record<AvailabilityState, string> = {
    available: t.availability.available,
    preferred_not: t.availability.preferredNot,
    unavailable: t.availability.unavailable,
  };

  return (
    <div className="select-none">
      <div className="md:hidden">
        <Legend hint={t.availability.tapToCycle} />
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, dateSlots]) => (
            <div key={date}>
              <div className="sticky top-14 bg-background py-1 z-10 space-y-2 mb-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {formatDate(dateSlots[0].start)}
                </h4>
                <DayLeaveSelector
                  date={date}
                  activePreset={getUserDayLeavePreset(
                    dayLeavePresetsByUser,
                    userId,
                    date
                  )}
                  onChange={onDayLeaveChange}
                />
              </div>
              <div className="space-y-2">
                {dateSlots.map((slot) => {
                  const state = getAvailabilityForUser(availability, userId, slot.id);
                  return (
                    <SlotButton
                      key={slot.id}
                      slot={slot}
                      state={state}
                      stateLabel={stateLabels[state]}
                      timeLabel={formatTime(slot.start)}
                      endTimeLabel={formatTime(slot.end)}
                      layout="mobile"
                      onPointerDown={(event) => handlePointerDown(slot.id, event)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:block">
        <Legend hint={t.availability.clickToCycle} />
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dateSlots]) => (
            <div key={date}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                <h4 className="text-sm font-semibold">
                  {formatDate(dateSlots[0].start)}
                </h4>
                <DayLeaveSelector
                  date={date}
                  activePreset={getUserDayLeavePreset(
                    dayLeavePresetsByUser,
                    userId,
                    date
                  )}
                  onChange={onDayLeaveChange}
                />
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {dateSlots.map((slot) => {
                  const state = getAvailabilityForUser(availability, userId, slot.id);
                  return (
                    <SlotButton
                      key={slot.id}
                      slot={slot}
                      state={state}
                      stateLabel={stateLabels[state]}
                      timeLabel={formatTime(slot.start)}
                      layout="desktop"
                      onPointerDown={(event) => handlePointerDown(slot.id, event)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
