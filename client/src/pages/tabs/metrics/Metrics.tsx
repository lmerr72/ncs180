import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { BarChart3, CalendarDays, Check, Percent, Users, UserMinus, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { TerritoryMap } from "./TerritoryMap";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACTIVE_CLIENTS_HISTORY, METRICS_YEARS, SALES_METRICS_BY_YEAR, TAX_CAMPAIGN_PARTICIPATION } from "./mock-data";

type MetricWidgetProps = {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconColor: string;
  iconBg: string;
  selectedYear: string;
  onYearChange: (year: string) => void;
};

function YearFilter({
  selectedYear,
  onYearChange,
  ariaLabel,
}: {
  selectedYear: string;
  onYearChange: (year: string) => void;
  ariaLabel: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          aria-label={ariaLabel}
        >
          <CalendarDays className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {METRICS_YEARS.map((year) => (
          <DropdownMenuItem
            key={year}
            onSelect={() => onYearChange(year)}
            className="justify-between"
          >
            {year}
            {year === selectedYear && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MetricWidget({
  icon: Icon,
  label,
  value,
  sub,
  iconColor,
  iconBg,
  selectedYear,
  onYearChange,
}: MetricWidgetProps) {
  return (
    <div className="relative min-w-0 rounded-xl border border-border bg-card p-3 shadow-sm sm:rounded-2xl sm:p-5">
      <div className="absolute right-3 top-3">
        <YearFilter
          selectedYear={selectedYear}
          onYearChange={onYearChange}
          ariaLabel={`Change ${label} year`}
        />
      </div>
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${iconBg} sm:h-11 sm:w-11 sm:rounded-xl`}>
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
      </div>
      <p className="pr-9 text-[10px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground sm:text-xs">{label}</p>
      <p className="mt-1 truncate text-2xl font-bold leading-none text-foreground sm:text-3xl">{value}</p>
      {sub && <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground sm:text-xs">{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Metrics() {
  const [activeClientsYear, setActiveClientsYear] = useState("2026");
  const [inactiveClientsYear, setInactiveClientsYear] = useState("2026");
  const [recoveryRateYear, setRecoveryRateYear] = useState("2026");
  const [taxCampaignYear, setTaxCampaignYear] = useState("2026");
  const [activeChartYear, setActiveChartYear] = useState("2026");
  const [territoryYear, setTerritoryYear] = useState("2026");
  const activeClientData = SALES_METRICS_BY_YEAR[activeClientsYear];
  const inactiveClientData = SALES_METRICS_BY_YEAR[inactiveClientsYear];
  const recoveryRateData = SALES_METRICS_BY_YEAR[recoveryRateYear];
  const chartData = ACTIVE_CLIENTS_HISTORY
    .filter((entry) => Number(entry.year) <= Number(activeChartYear))
    .slice(-5);
  const yearOverYearSubtext = `${activeClientData.yearOverYearChange >= 0 ? "+" : ""}${activeClientData.yearOverYearChange} vs prior year`;
  const taxCampaignData = TAX_CAMPAIGN_PARTICIPATION.find((entry) => entry.year === taxCampaignYear)
    ?? TAX_CAMPAIGN_PARTICIPATION[0];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Metrics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Performance overview and client analytics</p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <MetricWidget
            icon={Users}
            label="Active Clients"
            value={activeClientData.activeClients}
            sub={yearOverYearSubtext}
            iconColor="text-primary"
            iconBg="bg-primary/10"
            selectedYear={activeClientsYear}
            onYearChange={setActiveClientsYear}
          />
          <MetricWidget
            icon={UserMinus}
            label="Inactive Clients"
            value={inactiveClientData.inactiveClients}
            sub={`No placements in 12+ months during ${inactiveClientsYear}`}
            iconColor="text-destructive"
            iconBg="bg-destructive/10"
            selectedYear={inactiveClientsYear}
            onYearChange={setInactiveClientsYear}
          />
          <MetricWidget
            icon={TrendingUp}
            label="Avg Recovery Rate (YTD)"
            value={recoveryRateData.averageRecoveryRate}
            sub={recoveryRateData.averageRecoveryRateSubtext}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            selectedYear={recoveryRateYear}
            onYearChange={setRecoveryRateYear}
          />
          <div className="relative min-w-0 rounded-xl border border-border bg-card p-3 shadow-sm sm:rounded-2xl sm:p-5">
            <div className="absolute right-3 top-3">
              <YearFilter
                selectedYear={taxCampaignYear}
                onYearChange={setTaxCampaignYear}
                ariaLabel="Change tax campaign year"
              />
            </div>

            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 sm:h-11 sm:w-11 sm:rounded-xl">
              <Percent className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <p className="pr-9 text-[10px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground sm:text-xs">
              Tax Campaign Clients
            </p>
            <p className="mt-1 text-2xl font-bold leading-none text-foreground sm:text-3xl">
              {taxCampaignData.percentage}%
            </p>
            <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground sm:text-xs">
              Clients that took place in the {taxCampaignYear} tax campaign
            </p>
            <div className="mt-4 h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-cyan-600"
                style={{ width: `${taxCampaignData.percentage}%` }}
              />
            </div>
          </div>
        </div>



        {/* Active clients over time chart */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Active Clients Over Time</h2>
              <p className="text-xs text-muted-foreground mt-0.5">5-year trend ending in {activeChartYear}</p>
            </div>
            <YearFilter
              selectedYear={activeChartYear}
              onYearChange={setActiveChartYear}
              ariaLabel="Change active clients chart year"
            />
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="clientGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(195 27% 49%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(195 27% 49%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  itemStyle={{ color: "hsl(195 27% 49%)" }}
                  formatter={(val: number) => [`${val} clients`, "Active"]}
                />
                <Area
                  type="monotone"
                  dataKey="clients"
                  stroke="hsl(195 27% 49%)"
                  strokeWidth={2.5}
                  fill="url(#clientGradient)"
                  dot={{ r: 3.5, fill: "hsl(195 27% 49%)", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "hsl(195 27% 49%)", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              No active client history available yet.
            </div>
          )}
        </div>

        {/* Territory Map */}
        {/* <TerritoryMap
          selectedYear={territoryYear}
          onYearChange={setTerritoryYear}
          years={METRICS_YEARS}
        /> */}
      </div>
    </AppLayout>
  );
}
