"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
  PREFERRED_TIME_BANDS,
  togglePreferredTimeBand,
} from "@/lib/preferred-time-band";
import type { PreferredTimeBand } from "@/types";

interface PreferredTimeBandSelectorProps {
  value: PreferredTimeBand[];
  onChange: (bands: PreferredTimeBand[]) => void;
}

export function PreferredTimeBandSelector({
  value,
  onChange,
}: PreferredTimeBandSelectorProps) {
  const { t } = useI18n();
  const isUnset = value.length === 0;

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {t.availabilityPage.preferredTimeBandTitle}
        </p>
        <p className="text-xs text-muted-foreground">
          {t.availabilityPage.preferredTimeBandOptional}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange([])}
          className={cn(
            "text-sm px-3 py-2 min-h-[44px] rounded-md border transition-colors",
            isUnset
              ? "bg-foreground text-background border-foreground"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {t.availabilityPage.preferredTimeBandUnset}
        </button>
        {PREFERRED_TIME_BANDS.map((band) => {
          const active = value.includes(band);
          return (
            <button
              key={band}
              type="button"
              onClick={() => onChange(togglePreferredTimeBand(value, band))}
              className={cn(
                "text-sm px-3 py-2 min-h-[44px] rounded-md border transition-colors",
                active
                  ? "bg-primary/10 border-primary text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {t.availabilityPage.preferredTimeBands[band]}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {t.availabilityPage.preferredTimeBandNote}
      </p>
    </div>
  );
}
