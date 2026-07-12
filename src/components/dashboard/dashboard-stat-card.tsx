"use client";

import { AppLink } from "@/components/app-link";
import { motion } from "framer-motion";
import {
  Clock,
  Bell,
  CheckCircle2,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatVariant = "warning" | "info" | "success" | "purple";

const variantStyles: Record<
  StatVariant,
  { card: string; icon: string; count: string }
> = {
  warning: {
    card: "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10 hover:bg-yellow-50 dark:hover:bg-yellow-900/20",
    icon: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    count: "text-yellow-800 dark:text-yellow-300",
  },
  info: {
    card: "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20",
    icon: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    count: "text-blue-800 dark:text-blue-300",
  },
  success: {
    card: "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 hover:bg-green-50 dark:hover:bg-green-900/20",
    icon: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    count: "text-green-800 dark:text-green-300",
  },
  purple: {
    card: "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10 hover:bg-purple-50 dark:hover:bg-purple-900/20",
    icon: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
    count: "text-purple-800 dark:text-purple-300",
  },
};

interface DashboardStatCardProps {
  title: string;
  count: number;
  href: string;
  variant: StatVariant;
  icon: LucideIcon;
  subtitle?: string;
}

export function DashboardStatCard({
  title,
  count,
  href,
  variant,
  icon: Icon,
  subtitle,
}: DashboardStatCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="h-full">
      <AppLink href={href} className="block h-full">
        <Card
          className={cn(
            "h-full min-h-[calc(148px-3mm)] transition-colors cursor-pointer group",
            styles.card
          )}
        >
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p
                  className={cn(
                    "text-3xl md:text-4xl font-bold mt-1.5 tracking-tight",
                    styles.count
                  )}
                >
                  {count}
                </p>
                {subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  styles.icon
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center justify-end mt-3 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              <ChevronRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </AppLink>
    </motion.div>
  );
}

export const dashboardStatIcons = {
  pending: Bell,
  confirmation: CheckCircle2,
  recent: Clock,
} as const;
