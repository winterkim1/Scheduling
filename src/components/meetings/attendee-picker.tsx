"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUsers, CURRENT_USER_ID } from "@/lib/mock-data";
import { formatUserAffiliation } from "@/lib/user-utils";
import { cn, getInitials } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";
import type { User } from "@/types";

export type AttendeeDraftRole = "required" | "optional" | null;

export interface AttendeeDraft {
  userId: string;
  role: AttendeeDraftRole;
}

interface AttendeePickerProps {
  drafts: AttendeeDraft[];
  onChange: (drafts: AttendeeDraft[]) => void;
  locale: Locale;
}

export function AttendeePicker({ drafts, onChange, locale }: AttendeePickerProps) {
  const { t } = useI18n();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const inviteeUsers = useMemo(
    () =>
      getUsers(locale).filter(
        (user) => user.id !== CURRENT_USER_ID && user.role === "invitee"
      ),
    [locale]
  );

  const selectedIds = drafts.map((draft) => draft.userId);
  const pickerUsers = useMemo(() => {
    const candidates = inviteeUsers.filter(
      (user) => !selectedIds.includes(user.id)
    );
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return candidates;

    return candidates.filter(
      (user) =>
        user.name.toLowerCase().includes(normalized) ||
        user.department.toLowerCase().includes(normalized) ||
        user.jobTitle.toLowerCase().includes(normalized)
    );
  }, [inviteeUsers, searchQuery, selectedIds]);

  const hasBody = pickerOpen || drafts.length > 0;

  const addAttendee = (userId: string) => {
    onChange([...drafts, { userId, role: null }]);
    setSearchQuery("");
    setPickerOpen(false);
  };

  const removeAttendee = (userId: string) => {
    onChange(drafts.filter((draft) => draft.userId !== userId));
  };

  const setAttendeeRole = (userId: string, role: AttendeeDraftRole) => {
    onChange(
      drafts.map((draft) =>
        draft.userId === userId ? { ...draft, role } : draft
      )
    );
  };

  return (
    <Card>
      <div
        className={cn(
          "flex items-center justify-between gap-4 px-6 min-h-[4.5rem]",
          hasBody && "border-b"
        )}
      >
        <span className="text-base font-semibold leading-none">
          {t.createForm.attendees}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          onClick={() => setPickerOpen((open) => !open)}
          aria-label={t.createForm.addAttendee}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {hasBody && (
        <CardContent className="space-y-3 p-6 pt-4">
          {pickerOpen && (
            <div className="space-y-2 rounded-lg border p-3">
              <Input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t.createForm.searchAttendees}
              />
              {!searchQuery.trim() && pickerUsers.length > 0 && (
                <p className="text-xs text-muted-foreground px-1">
                  {t.createForm.inviteeListTitle}
                </p>
              )}
              {searchQuery.trim() && pickerUsers.length === 0 && (
                <p className="text-sm text-muted-foreground px-1">
                  {t.createForm.noSearchResults}
                </p>
              )}
              {pickerUsers.length > 0 && (
                <div className="max-h-48 overflow-y-auto divide-y rounded-md border">
                  {pickerUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors"
                      onClick={() => addAttendee(user.id)}
                    >
                      <AttendeeUserInfo user={user} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {drafts.map((draft) => {
            const user = inviteeUsers.find((item) => item.id === draft.userId);
            if (!user) return null;

            return (
              <div
                key={draft.userId}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border"
              >
                <AttendeeUserInfo user={user} />
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  <Button
                    type="button"
                    size="sm"
                    variant={draft.role === "required" ? "default" : "outline"}
                    className="h-9 px-2.5 text-xs"
                    onClick={() => setAttendeeRole(draft.userId, "required")}
                  >
                    {t.createForm.required}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={draft.role === "optional" ? "secondary" : "ghost"}
                    className="h-9 px-2.5 text-xs"
                    onClick={() => setAttendeeRole(draft.userId, "optional")}
                  >
                    {t.createForm.optional}
                  </Button>
                  <button
                    type="button"
                    className="touch-target flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => removeAttendee(draft.userId)}
                    aria-label={t.createForm.removeAttendee}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

export function draftsToAttendeeIds(drafts: AttendeeDraft[]): {
  requiredAttendeeIds: string[];
  optionalAttendeeIds: string[];
} {
  return {
    requiredAttendeeIds: drafts
      .filter((draft) => draft.role === "required")
      .map((draft) => draft.userId),
    optionalAttendeeIds: drafts
      .filter((draft) => draft.role === "optional")
      .map((draft) => draft.userId),
  };
}

export function hasUnassignedAttendeeRoles(drafts: AttendeeDraft[]): boolean {
  return drafts.some((draft) => draft.role === null);
}

function AttendeeUserInfo({ user }: { user: User }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-muted text-xs">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {user.name}
          <span className="text-xs font-normal text-muted-foreground">
            {" "}
            {formatUserAffiliation(user)}
          </span>
        </p>
      </div>
    </div>
  );
}
