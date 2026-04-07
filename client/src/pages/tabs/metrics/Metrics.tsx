import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { BarChart3, Users, UserMinus, TrendingUp, AlertCircle } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { TerritoryMap } from "./TerritoryMap";
import { StatCard } from "@/components/shared/StatCard";
import { getSalesMetrics, type SalesMetrics } from "@/services/metricsService";

const EMPTY_METRICS: SalesMetrics = {
  activeClients: 0,
  inactiveClients: 0,
  activeClientsHistory: [],
  yearOverYearChange: 0,
  averageRecoveryRate: "—",
  averageRecoveryRateSubtext: "Recovery-rate data is not available in GraphQL yet"
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Metrics() {
  const [metrics, setMetrics] = useState<SalesMetrics>(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadMetrics() {
      setLoading(true);
      setError(null);

      try {
        const nextMetrics = await getSalesMetrics();
        if (!ignore) {
          setMetrics(nextMetrics);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load metrics.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadMetrics();

    return () => {
      ignore = true;
    };
  }, []);

  const hasHistory = metrics.activeClientsHistory.length > 0;
  const yearOverYearSubtext = loading
    ? "Loading year-over-year change..."
    : error
      ? "Unable to load year-over-year change"
      : `${metrics.yearOverYearChange >= 0 ? "+" : ""}${metrics.yearOverYearChange} vs last year`;

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
        <div className="flex flex-row gap-4">
          <StatCard
            icon={Users}
            label="Active Clients"
            value={loading ? "..." : error ? "—" : metrics.activeClients}
            sub={yearOverYearSubtext}
            iconColor="text-primary"
            iconBg="bg-primary/10"
          />
          <StatCard
            icon={UserMinus}
            label="Inactive Clients"
            value={loading ? "..." : error ? "—" : metrics.inactiveClients}
            sub={error ? "Unable to load inactive client count" : "No placements in 12+ months"}
            iconColor="text-destructive"
            iconBg="bg-destructive/10"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Recovery Rate (YTD)"
            value={loading ? "..." : error ? "—" : metrics.averageRecoveryRate}
            sub={loading ? "Loading recovery-rate data..." : error ? "Unable to load recovery-rate data" : metrics.averageRecoveryRateSubtext}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
        </div>



        {/* Active clients over time chart */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-base font-bold text-foreground">Active Clients Over Time</h2>
            <p className="text-xs text-muted-foreground mt-0.5">10-year trend — all reps combined</p>
          </div>
          {error ? (
            <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-4 text-sm text-destructive">
              <AlertCircle className="mr-2 h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : hasHistory ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={metrics.activeClientsHistory} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
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
              {loading ? "Loading active client history..." : "No active client history available yet."}
            </div>
          )}
        </div>

        {/* Territory Map */}
        <TerritoryMap />
      </div>
    </AppLayout>
  );
}
