import { ko } from "./ko";
import { en } from "./en";
import type { Locale } from "./types";

export const translations = { ko, en } as const;
export type Translations = (typeof translations)[Locale];

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}
