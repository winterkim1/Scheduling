import { AppLink } from "@/components/app-link";
import { cn } from "@/lib/utils";

interface DashboardSectionHeaderProps {
  title: string;
  href?: string;
  linkLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function DashboardSectionHeader({
  title,
  href,
  linkLabel,
  icon,
  className,
}: DashboardSectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 min-h-8 mb-4",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <h2 className="text-lg font-semibold truncate">{title}</h2>
      </div>
      {href && linkLabel && (
        <AppLink
          href={href}
          className="text-sm text-muted-foreground hover:text-foreground shrink-0"
        >
          {linkLabel}
        </AppLink>
      )}
    </div>
  );
}
