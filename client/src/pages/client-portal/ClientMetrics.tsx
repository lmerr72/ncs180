import { useState, useRef, useEffect } from "react";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  CalendarDays, TrendingUp, TrendingDown, DollarSign,
  Award, BarChart2, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = "Last Month" | "Last Quarter" | "Year to Date";
const PERIODS: Period[] = ["Last Month", "Last Quarter", "Year to Date"];

// ── Mock data keyed by period ─────────────────────────────────────────────────

const COLLECTED_DATA: Record<Period, { label: string; value: number }[]> = {
  "Last Month": [
    { label: "Wk 1", value: 61000 },
    { label: "Wk 2", value: 74500 },
    { label: "Wk 3", value: 88200 },
    { label: "Wk 4", value: 60800 },
  ],
  "Last Quarter": [
    { label: "Jan",  value: 274000 },
    { label: "Feb",  value: 298500 },
    { label: "Mar",  value: 319250 },
  ],
  "Year to Date": [
    { label: "Jan",  value: 274000 },
    { label: "Feb",  value: 298500 },
    { label: "Mar",  value: 319250 },
    { label: "Apr",  value: 341800 },
    { label: "May",  value: 307600 },
    { label: "Jun",  value: 388200 },
    { label: "Jul",  value: 412500 },
    { label: "Aug",  value: 356400 },
    { label: "Sep",  value: 329000 },
    { label: "Oct",  value: 447300 },
    { label: "Nov",  value: 421700 },
    { label: "Dec",  value: 351350 },
  ],
};

const TOTALS: Record<Period, number> = {
  "Last Month":    284500,
  "Last Quarter":  891750,
  "Year to Date": 4247600,
};

const RECOVERY: Record<Period, { rate: number; prev: number }> = {
  "Last Month":   { rate: 73.2, prev: 70.8 },
  "Last Quarter": { rate: 71.8, prev: 68.4 },
  "Year to Date": { rate: 69.4, prev: 65.1 },
};

const HIGHEST: Record<Period, { company: string; amount: number }> = {
  "Last Month":   { company: "Meridian Group",      amount:  48200 },
  "Last Quarter": { company: "Pacific Ventures",    amount: 142300 },
  "Year to Date": { company: "Crestline Properties",amount: 387500 },
};

const AVG_PLACEMENT: Record<Period, { amount: number; count: number }> = {
  "Last Month":   { amount:  71125, count: 47  },
  "Last Quarter": { amount:  89175, count: 148 },
  "Year to Date": { amount: 103892, count: 621 },
};

// ── Date range dropdown ───────────────────────────────────────────────────────

function DateDropdown({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all",
          open
            ? "bg-primary/10 border-primary/30 text-primary"
            : "bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5"
        )}
      >
        <CalendarDays className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{value}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[160px]">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => { onChange(p); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors",
                value === p
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground hover:bg-muted/50"
              )}
            >
              {value === p && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
              {value !== p && <span className="w-1.5 h-1.5 flex-shrink-0" />}
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Widget shell ──────────────────────────────────────────────────────────────

function Widget({
  title, icon: Icon, accentColor = "text-primary", period, onPeriodChange, children,
}: {
  title: string;
  icon: React.ElementType;
  accentColor?: string;
  period: Period;
  onPeriodChange: (p: Period) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center">
            <Icon className={cn("w-4 h-4", accentColor)} />
          </div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
        </div>
        <DateDropdown value={period} onChange={onPeriodChange} />
      </div>
      {children}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function PeriodLabel({ p }: { p: Period }) {
  const map: Record<Period, string> = {
    "Last Month":   "vs. prior month",
    "Last Quarter": "vs. prior quarter",
    "Year to Date": "vs. prior year",
  };
  return <span className="text-xs text-muted-foreground">{map[p]}</span>;
}

// ── Custom tooltip for chart ──────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-bold text-foreground">{fmt$(payload[0].value)}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClientMetrics() {
  const [period1, setPeriod1] = useState<Period>("Last Quarter");
  const [period2, setPeriod2] = useState<Period>("Last Quarter");
  const [period3, setPeriod3] = useState<Period>("Last Quarter");
  const [period4, setPeriod4] = useState<Period>("Last Quarter");

  const recovery  = RECOVERY[period2];
  const rateUp    = recovery.rate >= recovery.prev;
  const rateDelta = Math.abs(recovery.rate - recovery.prev).toFixed(1);

  const highest   = HIGHEST[period3];
  const avgData   = AVG_PLACEMENT[period4];

  return (
    <ClientPortalLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
            <BarChart2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Metrics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Financial performance at a glance</p>
          </div>
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── Widget 1: Total Collected ── */}
          <Widget
            title="Total Money Collected"
            icon={DollarSign}
            period={period1}
            onPeriodChange={setPeriod1}
          >
            <div className="px-5 pb-2">
              <p className="text-3xl font-bold text-foreground tracking-tight">
                {fmt$(TOTALS[period1])}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {period1 === "Last Month" ? "This month" : period1 === "Last Quarter" ? "This quarter" : "Jan – Dec"}
              </p>
            </div>
            <div className="h-36 px-1 pb-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={COLLECTED_DATA[period1]} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#collectedGrad)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Widget>

          {/* ── Widget 2: Recovery Rate ── */}
          <Widget
            title="Recovery Rate"
            icon={TrendingUp}
            period={period2}
            onPeriodChange={setPeriod2}
          >
            <div className="px-5 pb-6 flex flex-col gap-4">
              {/* Big number */}
              <div className="flex items-end gap-3 mt-1">
                <p className="text-5xl font-bold text-foreground tracking-tight">
                  {recovery.rate}
                  <span className="text-3xl text-muted-foreground font-semibold">%</span>
                </p>
                <div className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border mb-1.5",
                  rateUp
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50    text-red-700    border-red-200"
                )}>
                  {rateUp
                    ? <TrendingUp   className="w-3.5 h-3.5" />
                    : <TrendingDown className="w-3.5 h-3.5" />
                  }
                  {rateDelta}%
                </div>
              </div>
              <PeriodLabel p={period2} />

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                  <span>Recovery progress</span>
                  <span>{recovery.rate}% of target 80%</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-700"
                    style={{ width: `${Math.min((recovery.rate / 80) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Prior comparison */}
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-muted/30 border border-border/50">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Prior period</p>
                  <p className="text-sm font-semibold text-foreground">{recovery.prev}%</p>
                </div>
                <div className="h-6 w-px bg-border mx-2" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Change</p>
                  <p className={cn("text-sm font-semibold", rateUp ? "text-emerald-600" : "text-red-600")}>
                    {rateUp ? "+" : "-"}{rateDelta}pp
                  </p>
                </div>
              </div>
            </div>
          </Widget>

          {/* ── Widget 3: Highest Placing Account ── */}
          <Widget
            title="Highest Placing Account"
            icon={Award}
            period={period3}
            onPeriodChange={setPeriod3}
          >
            <div className="px-5 pb-6 flex flex-col gap-4">
              {/* Account card */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/15">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-wider mb-0.5">Top Account</p>
                  <p className="text-lg font-bold text-foreground truncate">{highest.company}</p>
                  <p className="text-2xl font-bold text-primary mt-0.5">{fmt$(highest.amount)}</p>
                </div>
              </div>
              <PeriodLabel p={period3} />

              {/* Context bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Share of total collected</span>
                  <span>{((highest.amount / TOTALS[period3]) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                    style={{ width: `${Math.min((highest.amount / TOTALS[period3]) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </Widget>

          {/* ── Widget 4: Average Monthly File Placement ── */}
          <Widget
            title="Avg Monthly File Placement"
            icon={BarChart2}
            period={period4}
            onPeriodChange={setPeriod4}
          >
            <div className="px-5 pb-6 flex flex-col gap-4">
              <div className="mt-1">
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {fmt$(avgData.amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">per month, {period4.toLowerCase()}</p>
              </div>
              <PeriodLabel p={period4} />

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="px-4 py-3.5 rounded-xl bg-muted/30 border border-border/50 text-center">
                  <p className="text-2xl font-bold text-foreground">{avgData.count.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Files Placed</p>
                </div>
                <div className="px-4 py-3.5 rounded-xl bg-muted/30 border border-border/50 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {fmt$(Math.round(TOTALS[period4] / avgData.count))}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Avg per File</p>
                </div>
              </div>

              {/* Sparkline of monthly volumes */}
              <div className="space-y-1.5">
                {(period4 === "Last Month"
                  ? [{ label: "Wk 1", pct: 54 }, { label: "Wk 2", pct: 71 }, { label: "Wk 3", pct: 88 }, { label: "Wk 4", pct: 63 }]
                  : period4 === "Last Quarter"
                  ? [{ label: "Month 1", pct: 62 }, { label: "Month 2", pct: 80 }, { label: "Month 3", pct: 91 }]
                  : [{ label: "Q1", pct: 55 }, { label: "Q2", pct: 72 }, { label: "Q3", pct: 67 }, { label: "Q4", pct: 88 }]
                ).map(bar => (
                  <div key={bar.label} className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground w-16 flex-shrink-0">{bar.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all duration-500"
                        style={{ width: `${bar.pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground w-8 text-right">{bar.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Widget>
        </div>
      </div>
    </ClientPortalLayout>
  );
}
