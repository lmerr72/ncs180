export function StatCard({ icon: Icon, label, value, sub, iconColor, iconBg }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string;
    iconColor: string; iconBg: string;
  }) {
    return (
      <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm p-6 flex items-start gap-4">
    <div className={`p-3 rounded-xl ${iconBg} flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-foreground leading-none">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
        </div>
      </div>
    );
  }