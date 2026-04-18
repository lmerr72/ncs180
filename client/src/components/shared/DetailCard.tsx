import { cn } from "@/lib/utils";

export function DetailCard({ icon: Icon, label, value, color, bg, mono }: {
    icon: React.ElementType; label: string; value: string; color: string; bg: string; mono?: boolean;
  }) {
    return (
      <div className="min-w-0 bg-card rounded-xl p-3 border border-border shadow-sm flex items-center gap-2.5 hover-elevate sm:rounded-2xl sm:p-5 sm:gap-4 lg:p-6 lg:gap-5">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 sm:w-12 sm:h-12 sm:rounded-xl lg:w-14 lg:h-14 lg:rounded-2xl", bg)}>
          <Icon className={cn("w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7", color)} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground leading-tight sm:text-sm">{label}</p>
          <p className={cn("text-sm font-display font-bold text-foreground mt-0.5 truncate sm:text-lg lg:text-xl", mono && "font-mono text-xs sm:text-sm lg:text-base")}>{value}</p>
        </div>
      </div>
    );
  }
