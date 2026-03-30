import { cn } from "@/lib/utils";

export function DetailCard({ icon: Icon, label, value, color, bg, mono }: {
    icon: React.ElementType; label: string; value: string; color: string; bg: string; mono?: boolean;
  }) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex items-center gap-5 hover-elevate">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0", bg)}>
          <Icon className={cn("w-7 h-7", color)} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className={cn("text-xl font-display font-bold text-foreground mt-0.5 truncate", mono && "font-mono text-base")}>{value}</p>
        </div>
      </div>
    );
  }