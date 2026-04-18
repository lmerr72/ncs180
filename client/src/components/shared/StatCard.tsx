export function StatCard({ icon: Icon, label, value, sub, iconColor, iconBg }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string;
    iconColor: string; iconBg: string;
  }) {
    return (
      <div className="min-w-0 bg-card rounded-xl border border-border shadow-sm p-3 flex items-start gap-2.5 sm:rounded-2xl sm:p-5 sm:gap-4">
        <div className={`p-2 rounded-lg ${iconBg} flex-shrink-0 sm:p-3 sm:rounded-xl`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 leading-tight sm:text-xs">{label}</p>
          <p className="text-xl font-bold text-foreground leading-none truncate sm:text-3xl">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-1.5 leading-snug sm:text-xs">{sub}</p>}
        </div>
      </div>
    );
  }
