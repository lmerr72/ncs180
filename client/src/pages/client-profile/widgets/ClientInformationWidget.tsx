import { Building2, CalendarRange, MapPin, Pencil } from "lucide-react";
import type { Client } from "@/types/api";

type ClientInformationWidgetProps = {
  client: Client;
  onEdit: () => void;
};

function formatDisplayDate(value: string | null | undefined) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFullAddress(client: Client) {
  const { address1, address2, city, state, zipCode } = client.address ?? {};
  const lineOne = [address1, address2].filter(Boolean).join(", ");
  const lineTwo = [city, state, zipCode].filter(Boolean).join(", ");

  return [lineOne, lineTwo].filter(Boolean).join(", ") || "-";
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/10 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function ClientInformationWidget({ client, onEdit }: ClientInformationWidgetProps) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 bg-muted/20 px-6 py-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Client Information</h2>
          <p className="mt-1 text-xs text-muted-foreground">Core account details and placement timeline.</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
          aria-label="Edit client information"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
        <StatCard icon={Building2} label="Unit Count" value={client.unitCount.toLocaleString()} />
        <StatCard icon={MapPin} label="Address" value={formatFullAddress(client)} />
        <StatCard icon={CalendarRange} label="First File Placed" value={formatDisplayDate(client.firstFilePlacementDate)} />
        <StatCard icon={CalendarRange} label="Last File Placed" value={formatDisplayDate(client.mostRecentFilePlacementDate)} />
      </div>
    </div>
  );
}
