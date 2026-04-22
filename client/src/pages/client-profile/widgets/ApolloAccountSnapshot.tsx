import { Activity, BriefcaseBusiness, Sparkles, UserRound } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { formatCompactNumber, formatCurrency, formatMonthYear, timeAgo } from "@/helpers/formatters";

export type ApolloSnapshotResponse = {
  configured: boolean;
  matchedAccount: boolean;
  organization: {
    name: string;
    domain: string;
    website: string;
    industry: string;
    employeeCount: number | null;
    annualRevenue: number | null;
    location: string;
    keywords: string[];
  } | null;
  owner: {
    id: string;
    name: string;
    email: string;
    title: string;
  } | null;
  openDeals: Array<{
    id: string;
    name: string;
    stage: string;
    amount: number | null;
    closeDate: string | null;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    summary: string;
    at: string | null;
    actor: string;
  }>;
  warnings: string[];
  error?: string;
};

type ApolloAccountSnapshotProps = {
  snapshot: ApolloSnapshotResponse | null;
  statusMessage: string | null;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
};

export function ApolloAccountSnapshot({
  snapshot,
  statusMessage,
  enabled,
  onToggle,
}: ApolloAccountSnapshotProps) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Apollo Account Snapshot</h2>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {snapshot?.owner && enabled && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-background text-xs text-muted-foreground">
              <UserRound className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-foreground">{snapshot.owner.name}</span>
              {snapshot.owner.title && <span>{snapshot.owner.title}</span>}
            </div>
          )}
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span>Apollo</span>
            <Switch checked={enabled} onCheckedChange={onToggle} aria-label="Toggle Apollo account snapshot" />
          </label>
        </div>
      </div>

      {statusMessage ? (
        <div className="px-6 py-8 text-sm text-muted-foreground">
          {statusMessage}
        </div>
      ) : (
        <div className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Industry</p>
              <p className="mt-2 text-lg font-display font-semibold text-foreground">
                {snapshot?.organization?.industry || "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employees</p>
              <p className="mt-2 text-lg font-display font-semibold text-foreground">
                {formatCompactNumber(snapshot?.organization?.employeeCount)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue</p>
              <p className="mt-2 text-lg font-display font-semibold text-foreground">
                {formatCurrency(snapshot?.organization?.annualRevenue)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">HQ / Domain</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {snapshot?.organization?.location || snapshot?.organization?.domain || "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50 bg-muted/20 flex items-center gap-2">
                <BriefcaseBusiness className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Open Deals</h3>
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                  {snapshot?.openDeals.length ?? 0}
                </span>
              </div>
              <div className="divide-y divide-border/40">
                {(snapshot?.openDeals.length ?? 0) === 0 && (
                  <p className="px-4 py-5 text-sm text-muted-foreground">Apollo did not return any open deals for this account.</p>
                )}
                {snapshot?.openDeals.map((deal) => (
                  <div key={deal.id} className="px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{deal.name}</p>
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        {deal.stage}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatCurrency(deal.amount)}
                      {deal.closeDate ? ` · closes ${formatMonthYear(deal.closeDate)}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50 bg-muted/20 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Recent Activity</h3>
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                  {snapshot?.recentActivity.length ?? 0}
                </span>
              </div>
              <div className="divide-y divide-border/40">
                {(snapshot?.recentActivity.length ?? 0) === 0 && (
                  <p className="px-4 py-5 text-sm text-muted-foreground">Apollo did not return recent activity for this account.</p>
                )}
                {snapshot?.recentActivity.map((entry) => (
                  <div key={entry.id} className="px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                      <span className="inline-flex items-center rounded-full border border-border bg-muted/20 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                        {entry.type}
                      </span>
                    </div>
                    {entry.summary && (
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{entry.summary}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {entry.actor ? `${entry.actor} · ` : ""}
                      {entry.at ? timeAgo(entry.at) : "Timestamp unavailable"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {(snapshot?.organization?.keywords.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {snapshot?.organization?.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}

          {(snapshot?.warnings.length ?? 0) > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {snapshot?.warnings.join(" ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
