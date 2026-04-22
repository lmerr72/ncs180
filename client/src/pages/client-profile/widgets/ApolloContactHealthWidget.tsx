import { Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type ApolloContactHealthEntry = {
  firstName: string;
  lastName: string;
  title: string;
  currentEmail: string;
  currentPhone: string;
  currentLinkedIn: string;
  apolloEmail: string;
  apolloPhone: string;
  apolloLinkedIn: string;
  canImproveEmail: boolean;
  canImprovePhone: boolean;
  canImproveLinkedIn: boolean;
};

export type ApolloContactHealthResponse = {
  configured: boolean;
  contacts: ApolloContactHealthEntry[];
  warnings: string[];
  error?: string;
};

type ApolloContactHealthWidgetProps = {
  health: ApolloContactHealthResponse | null;
  entries: ApolloContactHealthEntry[];
  loading: boolean;
  error: string | null;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  contactsMissingEmail: number;
  contactsMissingPhone: number;
  contactsMissingLinkedIn: number;
  enrichableFields: number;
};

export function ApolloContactHealthWidget({
  health,
  entries,
  loading,
  error,
  enabled,
  onToggle,
  contactsMissingEmail,
  contactsMissingPhone,
  contactsMissingLinkedIn,
  enrichableFields,
}: ApolloContactHealthWidgetProps) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Contact Health</h2>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span>Apollo</span>
          <Switch checked={enabled} onCheckedChange={onToggle} aria-label="Toggle Apollo contact health" />
        </label>
      </div>

      {!enabled ? (
        <div className="px-6 py-8 text-sm text-muted-foreground">Turn on Apollo to check contact coverage.</div>
      ) : loading ? (
        <div className="px-6 py-8 text-sm text-muted-foreground">Checking Apollo contact coverage...</div>
      ) : error ? (
        <div className="px-6 py-8 text-sm text-destructive">{error}</div>
      ) : (
        <div className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Missing Email</p>
              <p className="mt-2 text-lg font-display font-semibold text-foreground">{contactsMissingEmail}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Missing Phone</p>
              <p className="mt-2 text-lg font-display font-semibold text-foreground">{contactsMissingPhone}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Missing LinkedIn</p>
              <p className="mt-2 text-lg font-display font-semibold text-foreground">{contactsMissingLinkedIn}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Apollo Fill Opportunities</p>
              <p className="mt-2 text-lg font-display font-semibold text-foreground">{enrichableFields}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Coverage By Contact</h3>
            </div>
            <div className="divide-y divide-border/40">
              {entries.length === 0 && (
                <p className="px-4 py-5 text-sm text-muted-foreground">No contacts are available to score yet.</p>
              )}
              {entries.map((entry) => (
                <div key={`${entry.firstName}-${entry.lastName}-${entry.title}`} className="px-4 py-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{entry.firstName} {entry.lastName}</p>
                      {entry.title && <p className="text-xs text-muted-foreground mt-1">{entry.title}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold",
                        entry.currentEmail ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                      )}>
                        {entry.currentEmail ? "Email on file" : entry.canImproveEmail ? "Apollo can add email" : "Missing email"}
                      </span>
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold",
                        entry.currentPhone ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                      )}>
                        {entry.currentPhone ? "Phone on file" : entry.canImprovePhone ? "Apollo can add phone" : "Missing phone"}
                      </span>
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold",
                        entry.currentLinkedIn ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                      )}>
                        {entry.currentLinkedIn ? "LinkedIn on file" : entry.canImproveLinkedIn ? "Apollo can add LinkedIn" : "Missing LinkedIn"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(health?.warnings.length ?? 0) > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {health?.warnings.join(" ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
