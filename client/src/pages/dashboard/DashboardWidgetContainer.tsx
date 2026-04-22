import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardWidgetContainerProps = {
  title: string;
  icon?: ReactNode;
  subtitle?: string;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
};

export default function DashboardWidgetContainer({
  title,
  icon,
  subtitle,
  headerActions,
  children,
  className,
  bodyClassName,
  headerClassName,
}: DashboardWidgetContainerProps) {
  return (
    <div className={cn("bg-card rounded-2xl border border-border shadow-sm hover-elevate flex flex-col overflow-hidden max-h-[32rem] min-w-0 lg:min-w-[22rem]", className)}>
      <div className={cn("px-4 py-3.5 border-b border-border/50 bg-muted/20 shrink-0 flex items-start justify-between gap-3", headerClassName)}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-sm font-bold text-foreground">{title}</h2>
          </div>
          {subtitle ? <p className="text-xs text-muted-foreground mt-1">{subtitle}</p> : null}
        </div>

        {headerActions ? <div className="flex items-center gap-1.5 shrink-0">{headerActions}</div> : null}
      </div>

      <div className={cn("flex-1 overflow-y-auto", bodyClassName)}>
        {children}
      </div>
    </div>
  );
}
