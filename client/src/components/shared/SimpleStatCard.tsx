import { formatLabel } from "@/helpers/formatters";

// hippo refactor the stat card to make icon an optional prop
export function SimpleStatCard({  label, value }) {
    return (
        <div key={label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <p className="text-xs text-muted-foreground font-medium mb-1">{formatLabel(label)}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    );
  }