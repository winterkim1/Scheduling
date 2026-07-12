"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Monitor, Smartphone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export default function PreviewPage() {
  const { t } = useI18n();
  const previewRoutes = useMemo(
    () => [
      { path: "/", label: t.preview.routes.dashboard },
      { path: "/meetings", label: t.preview.routes.meetings },
      { path: "/meetings/meeting-1", label: t.preview.routes.meetingDetail },
      { path: "/meetings/record", label: t.preview.routes.meetingRecord },
      { path: "/meetings/meeting-2/availability", label: t.preview.routes.availability },
      { path: "/calendar", label: t.preview.routes.calendar },
      { path: "/analytics", label: t.preview.routes.analytics },
      { path: "/notifications", label: t.preview.routes.notifications },
      { path: "/profile", label: t.preview.routes.profile },
      { path: "/settings", label: t.preview.routes.settings },
    ],
    [t.preview.routes]
  );

  const [route, setRoute] = useState(previewRoutes[0].path);
  const [mobileFrame, setMobileFrame] = useState<"iphone" | "android">("iphone");

  const mobileWidth = mobileFrame === "iphone" ? 390 : 412;
  const mobileHeight = mobileFrame === "iphone" ? 844 : 915;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-muted-foreground" />
            <div>
              <h1 className="font-semibold text-sm">{t.preview.title}</h1>
              <p className="text-xs text-muted-foreground">{t.preview.subtitle}</p>
            </div>
          </div>

          <select
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm min-w-[200px] flex-1 md:flex-none md:min-w-[280px]"
          >
            {previewRoutes.map((r) => (
              <option key={r.path} value={r.path}>
                {r.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Button
              variant={mobileFrame === "iphone" ? "default" : "outline"}
              size="sm"
              onClick={() => setMobileFrame("iphone")}
            >
              iPhone
            </Button>
            <Button
              variant={mobileFrame === "android" ? "default" : "outline"}
              size="sm"
              onClick={() => setMobileFrame("android")}
            >
              Android
            </Button>
          </div>

          <Link href={route} target="_blank" className="ml-auto">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4" />
              {t.preview.openNewTab}
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-4 p-4 md:p-6 min-h-[calc(100vh-57px)]">
        <section className="flex-1 flex flex-col min-h-0 min-w-0 xl:min-w-[800px]">
          <div className="flex items-center gap-2 mb-3">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">{t.preview.desktop}</h2>
            <span className="text-xs text-muted-foreground">{t.preview.desktopHint}</span>
          </div>
          <div className="flex-1 rounded-xl border bg-background shadow-sm overflow-hidden min-h-[480px]">
            <iframe
              key={`desktop-${route}`}
              src={route}
              title="Desktop preview"
              className="w-full h-full min-h-[480px] xl:min-h-[calc(100vh-140px)]"
            />
          </div>
        </section>

        <section className="xl:w-auto flex flex-col items-center min-h-0">
          <div className="flex items-center gap-2 mb-3 self-start xl:self-center">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">{t.preview.mobile}</h2>
            <span className="text-xs text-muted-foreground">
              {mobileWidth}×{mobileHeight}
            </span>
          </div>
          <div
            className="rounded-[2rem] border-[10px] border-neutral-800 bg-neutral-800 shadow-2xl overflow-hidden shrink-0"
            style={{ width: mobileWidth + 20, height: mobileHeight + 20 }}
          >
            <div
              className="rounded-[1.25rem] overflow-hidden bg-background"
              style={{ width: mobileWidth, height: mobileHeight }}
            >
              <iframe
                key={`mobile-${route}-${mobileFrame}`}
                src={route}
                title="Mobile preview"
                className="w-full h-full border-0"
                style={{ width: mobileWidth, height: mobileHeight }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
