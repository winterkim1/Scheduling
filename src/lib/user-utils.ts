import type { User } from "@/types";

export function formatUserAffiliation(user: User): string {
  if (user.department) {
    return `${user.department} · ${user.jobTitle}`;
  }
  return user.jobTitle;
}

export function filterUsersForAttendeeSearch(
  users: User[],
  query: string,
  excludeIds: string[]
): User[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return users.filter((user) => {
    if (excludeIds.includes(user.id)) return false;

    return (
      user.name.toLowerCase().includes(normalized) ||
      user.department.toLowerCase().includes(normalized) ||
      user.jobTitle.toLowerCase().includes(normalized)
    );
  });
}
