import { format, parseISO } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import type { Locale } from "./types";

const dateLocales = { ko, en: enUS };

export function formatLocalizedDate(date: string, locale: Locale) {
  const pattern = locale === "ko" ? "yyyy년 M월 d일" : "MMM d, yyyy";
  return format(parseISO(date), pattern, { locale: dateLocales[locale] });
}

export function formatLocalizedTime(date: string, locale: Locale) {
  const pattern = locale === "ko" ? "a h:mm" : "h:mm a";
  return format(parseISO(date), pattern, { locale: dateLocales[locale] });
}

export function formatLocalizedDateTime(date: string, locale: Locale) {
  const pattern =
    locale === "ko" ? "yyyy년 M월 d일 · a h:mm" : "MMM d, yyyy · h:mm a";
  return format(parseISO(date), pattern, { locale: dateLocales[locale] });
}

export function formatResponseDeadline(date: string, locale: Locale) {
  const hasTime = date.includes("T");
  const parsed = parseISO(hasTime ? date : `${date}T15:00:00`);

  if (locale === "ko") {
    const day = format(parsed, "M/d", { locale: dateLocales[locale] });
    const weekday = format(parsed, "EEE", { locale: dateLocales[locale] });
    const time = format(parsed, "HH:mm", { locale: dateLocales[locale] });
    return `${day}(${weekday}) ${time}`;
  }

  return format(parsed, "M/d (EEE) HH:mm", { locale: dateLocales[locale] });
}

function formatScheduledDayLabel(date: string, locale: Locale) {
  if (locale === "ko") {
    const day = format(parseISO(date), "M/d", { locale: dateLocales[locale] });
    const weekday = format(parseISO(date), "EEE", { locale: dateLocales[locale] });
    return `${day}(${weekday})`;
  }
  return format(parseISO(date), "M/d (EEE)", { locale: dateLocales[locale] });
}

export function formatScheduledDateRange(
  start: string,
  end: string,
  locale: Locale
) {
  if (start === end) {
    const pattern = locale === "ko" ? "M월 d일 (EEEE)" : "MMM d (EEEE)";
    return format(parseISO(start), pattern, { locale: dateLocales[locale] });
  }

  return `${formatScheduledDayLabel(start, locale)}~${formatScheduledDayLabel(end, locale)}`;
}

export function formatLocalizedDuration(minutes: number, locale: Locale) {
  if (minutes < 60) return locale === "ko" ? `${minutes}분` : `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (locale === "ko") {
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  }
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
