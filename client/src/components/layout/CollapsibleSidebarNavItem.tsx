import { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CollapsibleSidebarNavItemProps {
  to: string;
  label: string;
  icon: ComponentType<LucideProps>;
  isActive: boolean;
  collapsed: boolean;
}

export function CollapsibleSidebarNavItem({
  to,
  label,
  icon: Icon,
  isActive,
  collapsed,
}: CollapsibleSidebarNavItemProps) {
  const link = (
    <NavLink
      aria-label={collapsed ? label : undefined}
      className={cn(
        "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
        collapsed ? "justify-center" : "gap-3",
        isActive
          ? "bg-sidebar-primary/10 text-sidebar-primary"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
      to={to}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
        )}
      />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </NavLink>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
