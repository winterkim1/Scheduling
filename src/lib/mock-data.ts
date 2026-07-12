import type { User } from "@/types";
import type { Locale } from "./i18n/types";

export const CURRENT_USER_ID = "user-1";

const usersByLocale: Record<Locale, User[]> = {
  ko: [
    {
      id: "user-1",
      name: "김토스",
      email: "kim.toss@company.com",
      role: "organizer",
      department: "디자인팀",
      jobTitle: "사원",
    },
    {
      id: "user-2",
      name: "이서연",
      email: "seoyeon.lee@company.com",
      role: "invitee",
      department: "프로덕트팀",
      jobTitle: "매니저",
    },
    {
      id: "user-3",
      name: "박준호",
      email: "junho.park@company.com",
      role: "invitee",
      department: "엔지니어링팀",
      jobTitle: "리드",
    },
    {
      id: "user-4",
      name: "최유진",
      email: "yujin.choi@company.com",
      role: "invitee",
      department: "마케팅팀",
      jobTitle: "사원",
    },
    {
      id: "user-5",
      name: "정태영",
      email: "taeyoung.jung@company.com",
      role: "invitee",
      department: "세일즈팀",
      jobTitle: "매니저",
    },
    {
      id: "user-6",
      name: "한소희",
      email: "sohee.han@company.com",
      role: "invitee",
      department: "디자인팀",
      jobTitle: "인턴",
    },
  ],
  en: [
    {
      id: "user-1",
      name: "Kim Toss",
      email: "kim.toss@company.com",
      role: "organizer",
      department: "Design Team",
      jobTitle: "Staff",
    },
    {
      id: "user-2",
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      role: "invitee",
      department: "Product Team",
      jobTitle: "Manager",
    },
    {
      id: "user-3",
      name: "Marcus Thompson",
      email: "marcus.thompson@company.com",
      role: "invitee",
      department: "Engineering Team",
      jobTitle: "Lead",
    },
    {
      id: "user-4",
      name: "Emily Davis",
      email: "emily.davis@company.com",
      role: "invitee",
      department: "Marketing Team",
      jobTitle: "Associate",
    },
    {
      id: "user-5",
      name: "James Wilson",
      email: "james.wilson@company.com",
      role: "invitee",
      department: "Sales Team",
      jobTitle: "Manager",
    },
    {
      id: "user-6",
      name: "Olivia Brown",
      email: "olivia.brown@company.com",
      role: "invitee",
      department: "Design Team",
      jobTitle: "Intern",
    },
  ],
};

export function getUsers(locale: Locale = "ko"): User[] {
  return usersByLocale[locale];
}

export function getUserById(
  id: string,
  locale: Locale = "ko"
): User | undefined {
  return usersByLocale[locale].find((u) => u.id === id);
}

export function getCurrentUser(locale: Locale = "ko"): User {
  return usersByLocale[locale].find((u) => u.id === CURRENT_USER_ID)!;
}

/** @deprecated Use getUsers(locale) with useI18n */
export const users = usersByLocale.ko;
