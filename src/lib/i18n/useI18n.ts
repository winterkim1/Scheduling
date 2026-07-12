"use client";

import { useMeetingStore } from "@/store/meeting-store";
import { getTranslations, type Translations } from "./translations";
import type { Locale } from "./types";
import {
  formatLocalizedDate,
  formatLocalizedTime,
  formatLocalizedDateTime,
  formatLocalizedDuration,
  formatResponseDeadline,
  formatScheduledDateRange,
} from "./format";

export function useI18n(): {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  formatDateTime: (date: string) => string;
  formatDuration: (minutes: number) => string;
  formatResponseDeadline: (date: string) => string;
  formatScheduledDateRange: (start: string, end: string) => string;
} {
  const locale = useMeetingStore((s) => s.locale);
  const setLocale = useMeetingStore((s) => s.setLocale);
  return {
    locale,
    t: getTranslations(locale),
    setLocale,
    formatDate: (date) => formatLocalizedDate(date, locale),
    formatTime: (date) => formatLocalizedTime(date, locale),
    formatDateTime: (date) => formatLocalizedDateTime(date, locale),
    formatDuration: (minutes) => formatLocalizedDuration(minutes, locale),
    formatResponseDeadline: (date) => formatResponseDeadline(date, locale),
    formatScheduledDateRange: (start, end) =>
      formatScheduledDateRange(start, end, locale),
  };
}
