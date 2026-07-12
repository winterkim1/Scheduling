"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatisticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatisticsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: StatisticsCardProps) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className={cn("overflow-hidden h-full", className)}>
        <CardContent className="p-5 h-full">
          <div className="flex h-full items-start justify-between">
            <div className="flex min-h-[5.5rem] flex-col">
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 tracking-tight">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
              {trend ? (
                <p
                  className={cn(
                    "text-xs mt-2 font-medium",
                    trend.value >= 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  {trend.value >= 0 ? "+" : ""}
                  {trend.value}% {trend.label}
                </p>
              ) : (
                <p className="text-xs mt-2 font-medium invisible" aria-hidden>
                  +0% —
                </p>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
