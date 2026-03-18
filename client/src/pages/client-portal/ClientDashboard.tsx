import { useState } from "react";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import {
  AlertTriangle, AlertCircle, Info, TrendingDown,
  ShieldAlert, FileWarning, ChevronRight, CheckCircle2,
  DollarSign, BarChart2, FileText, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Issue mock data ───────────────────────────────────────────────────────────

type IssueSeverity = "critical" | "warning" | "info";

interface Issue {
  id: string;
  severity: IssueSeverity;
  category: string;
  property: string;
  headline: string;
  detail: string;
  actionLabel: string;
}

const ISSUES: Issue[] = [
  {
    id: "iss-1",
    severity: "critical",
    category: "Placements",
    property: "Crestline Properties",
    headline: "Placements below 12-month rolling average",
    detail: "Current monthly placements are 34% below the rolling 12-month average of $89,200. This trend has persisted for 3 consecutive months.",
    actionLabel: "View Placement History",
  },
  {
    id: "iss-2",
    severity: "critical",
    category: "Placements",
    property: "Meridian Group",
    headline: "Placements below 12-month rolling average",
    detail: "Current monthly placements are 18% below the rolling 12-month average of $61,400. Review recent account activity for potential gaps.",
    actionLabel: "View Placement History",
  },
  {
    id: "iss-3",
    severity: "warning",
    category: "Info Quality",
    property: "Pacific Ventures",
    headline: "Information Quality Score below threshold",
    detail: "Current IQ Score is 47 / 100 — below the required minimum of 60. Incomplete debtor contact data is the primary contributing factor.",
    actionLabel: "Review Account Data",
  },
  {
    id: "iss-4",
    severity: "warning",
    category: "Info Quality",
    property: "Ridgeway Commons",
    headline: "Information Quality Score below threshold",
    detail: "Current IQ Score is 53 / 100. Missing phone numbers and employer information on 22 accounts are lowering the score.",
    actionLabel: "Review Account Data",
  },
  {
    id: "iss-5",
    severity: "warning",
    category: "Documentation",
    property: "Harborview Estates",
    headline: "Missing leases on 50%+ of accounts",
    detail: "67 of 112 active accounts (59.8%) are missing signed lease agreements. Leases are required to proceed with legal collection efforts.",
    actionLabel: "Upload Leases",
  },
  {
    id: "iss-6",
    severity: "info",
    category: "Documentation",
    property: "Sunridge Apartments",
    headline: "Missing leases on 50%+ of accounts",
    detail: "51 of 98 active accounts (52.0%) are missing lease documentation. Providing these will improve recovery probability.",
    actionLabel: "Upload Leases",
  },
];

// ── Stat tiles mock data ──────────────────────────────────────────────────────

const STATS = [
  { label: "Open Issues",       value: "6",      sub: "3 critical",    icon: AlertTriangle, accent: "text-red-500",    bg: "bg-red-50    border-red-200"    },
  { label: "Total Collected",   value: "$891.8K", sub: "This quarter",  icon: DollarSign,    accent: "text-primary",    bg: "bg-primary/5 border-primary/20"  },
  { label: "Recovery Rate",     value: "71.8%",  sub: "This quarter",  icon: BarChart2,     accent: "text-emerald-600",bg: "bg-emerald-50 border-emerald-200"},
  { label: "Active Reports",    value: "5",      sub: "Templates ready",icon: FileText,     accent: "text-violet-600", bg: "bg-violet-50  border-violet-200" },
];

// ── Severity config ───────────────────────────────────────────────────────────

const SEV: Record<IssueSeverity, {
  icon: React.ElementType;
  dot: string;
  badge: string;
  row: string;
  border: string;
}> = {
  critical: {
    icon: AlertCircle,
    dot:   "bg-red-500",
    badge: "bg-red-100 text-red-700 border-red-200",
    row:   "hover:bg-red-50/40",
    border:"border-l-red-400",
  },
  warning: {
    icon: AlertTriangle,
    dot:   "bg-amber-400",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    row:   "hover:bg-amber-50/40",
    border:"border-l-amber-400",
  },
  info: {
    icon: Info,
    dot:   "bg-sky-400",
    badge: "bg-sky-100 text-sky-700 border-sky-200",
    row:   "hover:bg-sky-50/40",
    border:"border-l-sky-400",
  },
};

const CAT_ICONS: Record<string, React.ElementType> = {
  "Placements":    TrendingDown,
  "Info Quality":  ShieldAlert,
  "Documentation": FileWarning,
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClientDashboard() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded]   = useState<string | null>(null);

  const visible  = ISSUES.filter(i => !dismissed.has(i.id));
  const critical = visible.filter(i => i.severity === "critical").length;
  const warnings = visible.filter(i => i.severity === "warning").length;

  function dismiss(id: string) {
    setDismissed(prev => new Set([...prev, id]));
    if (expanded === id) setExpanded(null);
  }

  return (
    <ClientPortalLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back, Kathy — here's your account overview.</p>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={cn("rounded-2xl border p-4 flex flex-col gap-2.5", s.bg)}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
                  <Icon className={cn("w-4 h-4", s.accent)} />
                </div>
                <p className={cn("text-2xl font-bold", s.accent)}>{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Issues widget */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Widget header */}
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Issues to Address</p>
                <p className="text-[11px] text-muted-foreground">
                  {visible.length === 0
                    ? "All issues resolved"
                    : `${visible.length} open — ${critical} critical, ${warnings} warning`}
                </p>
              </div>
            </div>

            {/* Legend */}
            {visible.length > 0 && (
              <div className="hidden sm:flex items-center gap-3">
                {(["critical", "warning", "info"] as IssueSeverity[]).map(s => (
                  <div key={s} className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full", SEV[s].dot)} />
                    <span className="text-[11px] text-muted-foreground capitalize">{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All clear */}
          {visible.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-foreground">All issues addressed</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                No open issues right now. Check back after your next reporting cycle.
              </p>
            </div>
          )}

          {/* Issue rows */}
          {visible.length > 0 && (
            <div className="divide-y divide-border/40">
              {visible.map(issue => {
                const cfg     = SEV[issue.severity];
                const SevIcon = cfg.icon;
                const CatIcon = CAT_ICONS[issue.category] ?? AlertTriangle;
                const isOpen  = expanded === issue.id;

                return (
                  <div
                    key={issue.id}
                    className={cn("border-l-4 transition-colors", cfg.border, isOpen ? "bg-muted/20" : cfg.row)}
                  >
                    {/* Row header */}
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : issue.id)}
                      className="w-full flex items-start gap-4 px-5 py-4 text-left"
                    >
                      {/* Severity icon */}
                      <SevIcon className={cn(
                        "w-4 h-4 mt-0.5 flex-shrink-0",
                        issue.severity === "critical" ? "text-red-500"
                          : issue.severity === "warning" ? "text-amber-500"
                          : "text-sky-500"
                      )} />

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{issue.headline}</span>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1",
                            cfg.badge
                          )}>
                            <CatIcon className="w-2.5 h-2.5" />
                            {issue.category}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{issue.property}</p>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ChevronRight className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          isOpen && "rotate-90"
                        )} />
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="px-5 pb-4 pl-[3.25rem] flex flex-col gap-3">
                        <p className="text-sm text-muted-foreground leading-relaxed">{issue.detail}</p>
                        <div className="flex items-center gap-3">
                          <button className={cn(
                            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm",
                            issue.severity === "critical"
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : issue.severity === "warning"
                              ? "bg-amber-500 text-white hover:bg-amber-600"
                              : "bg-sky-500 text-white hover:bg-sky-600"
                          )}>
                            {issue.actionLabel}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => dismiss(issue.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ClientPortalLayout>
  );
}
