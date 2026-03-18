import { useState } from "react";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import {
  FileBarChart2, FileText, BarChart3, Layers,
  CalendarRange, Download, CheckCircle2, Clock, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Report templates ──────────────────────────────────────────────────────────

type ReportStatus = "idle" | "generating" | "ready";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  lastRun?: string;
}

const TEMPLATES: ReportTemplate[] = [
  {
    id: "inventory",
    name: "Inventory Report",
    description: "A full listing of all accounts currently in inventory, including balance, status, and placement date.",
    icon: Layers,
    category: "Inventory",
    lastRun: "Mar 12, 2026",
  },
  {
    id: "summary",
    name: "Summary Report",
    description: "High-level overview of collection activity, total placements, recoveries, and outstanding balances.",
    icon: FileText,
    category: "Summary",
    lastRun: "Mar 15, 2026",
  },
  {
    id: "management-summary",
    name: "Management Summary Report",
    description: "Executive-level snapshot designed for leadership review, highlighting key KPIs and trends.",
    icon: FileBarChart2,
    category: "Summary",
    lastRun: "Mar 1, 2026",
  },
  {
    id: "recovery-by-balance",
    name: "Recovery by Balance Report",
    description: "Breaks down recovery rates segmented by account balance ranges to identify performance patterns.",
    icon: BarChart3,
    category: "Recovery",
    lastRun: "Feb 28, 2026",
  },
  {
    id: "stats-by-date",
    name: "Stats by Date Placed",
    description: "Statistical analysis of accounts grouped by placement date, showing aging and recovery timelines.",
    icon: CalendarRange,
    category: "Analytics",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Inventory": "bg-sky-100    text-sky-700    border-sky-200",
  "Summary":   "bg-violet-100 text-violet-700 border-violet-200",
  "Recovery":  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Analytics": "bg-amber-100  text-amber-700  border-amber-200",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClientReports() {
  const [statuses, setStatuses] = useState<Record<string, ReportStatus>>({});
  const [selected, setSelected] = useState<string | null>(null);

  function generateReport(id: string) {
    setStatuses(prev => ({ ...prev, [id]: "generating" }));
    setTimeout(() => {
      setStatuses(prev => ({ ...prev, [id]: "ready" }));
    }, 1800);
  }

  function getStatus(id: string): ReportStatus {
    return statuses[id] ?? "idle";
  }

  return (
    <ClientPortalLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
            <FileBarChart2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Generate and download account reports</p>
          </div>
        </div>

        {/* Template list */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/50 bg-muted/20">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Available Templates — {TEMPLATES.length}
            </p>
          </div>

          <div className="divide-y divide-border/40">
            {TEMPLATES.map(t => {
              const status   = getStatus(t.id);
              const isActive = selected === t.id;
              const Icon     = t.icon;

              return (
                <div
                  key={t.id}
                  className={cn(
                    "group transition-colors",
                    isActive ? "bg-primary/4" : "hover:bg-muted/20"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(isActive ? null : t.id)}
                    className="w-full flex items-start gap-4 px-5 py-4 text-left"
                  >
                    {/* Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors border",
                      isActive
                        ? "bg-primary/15 border-primary/25 text-primary"
                        : "bg-muted/40 border-border group-hover:bg-primary/8 group-hover:border-primary/20 text-muted-foreground group-hover:text-primary"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={cn(
                          "text-sm font-semibold transition-colors",
                          isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                        )}>
                          {t.name}
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          CATEGORY_COLORS[t.category]
                        )}>
                          {t.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {t.description}
                      </p>
                      {t.lastRun && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          Last run {t.lastRun}
                        </p>
                      )}
                    </div>

                    {/* Chevron */}
                    <ChevronRight className={cn(
                      "w-4 h-4 flex-shrink-0 mt-3 transition-all text-muted-foreground",
                      isActive ? "rotate-90 text-primary" : "group-hover:translate-x-0.5"
                    )} />
                  </button>

                  {/* Expanded action panel */}
                  {isActive && (
                    <div className="px-5 pb-4 pl-[4.75rem]">
                      <div className="flex items-center gap-3 pt-1">
                        {status === "idle" && (
                          <button
                            onClick={() => generateReport(t.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Generate Report
                          </button>
                        )}

                        {status === "generating" && (
                          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground">
                            <svg className="w-3.5 h-3.5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            Generating…
                          </div>
                        )}

                        {status === "ready" && (
                          <>
                            <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                              <CheckCircle2 className="w-4 h-4" />
                              Ready to download
                            </div>
                            <button
                              onClick={() => generateReport(t.id)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </button>
                            <button
                              onClick={() => setStatuses(prev => ({ ...prev, [t.id]: "idle" }))}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Regenerate
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ClientPortalLayout>
  );
}
