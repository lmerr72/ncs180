import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MOCK_MY_CLIENTS } from "@/lib/mock-data";
import { BarChart3, Users, UserMinus, TrendingUp, MapPin } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { ACTIVE_CLIENTS_HISTORY, TOTAL_INACTIVE } from "./mock-data";
import { TerritoryMap } from "./TerritoryMap";
import { STATE_TERRITORIES,type RepKey } from "@/lib/mock-data";
import { StatCard } from "@/components/shared/StatCard";


const avgRecoveryRate = (() => {
  const rates = MOCK_MY_CLIENTS.map(c => c.recoveryRate);
  return (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1);
})();
const activeCount = ACTIVE_CLIENTS_HISTORY[ACTIVE_CLIENTS_HISTORY.length - 1].clients;
const prevYearCount = ACTIVE_CLIENTS_HISTORY[ACTIVE_CLIENTS_HISTORY.length - 2].clients;
const yoyChange = activeCount - prevYearCount;





// ── Page ──────────────────────────────────────────────────────────────────────

export default function Metrics() {
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
          <StatCard icon={Users} label="Active Clients" value={activeCount} sub={`+${yoyChange} vs last year`} iconColor="text-primary" iconBg="bg-primary/10" />
          <StatCard icon={UserMinus} label="Inactive Clients" value={TOTAL_INACTIVE} sub="No placements in 12+ months" iconColor="text-destructive" iconBg="bg-destructive/10" />
          <StatCard icon={TrendingUp} label="Avg Recovery Rate (YTD)" value={`${avgRecoveryRate}%`} sub="Across all my clients this year" iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        </div>



        {/* Active clients over time chart */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-base font-bold text-foreground">Active Clients Over Time</h2>
            <p className="text-xs text-muted-foreground mt-0.5">10-year trend — all reps combined</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={ACTIVE_CLIENTS_HISTORY} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="clientGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(195 27% 49%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(195 27% 49%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 180]} />
              <RechartsTooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                itemStyle={{ color: "hsl(195 27% 49%)" }}
                formatter={(val: number) => [`${val} clients`, "Active"]}
              />
              <Area type="monotone" dataKey="clients" stroke="hsl(195 27% 49%)" strokeWidth={2.5} fill="url(#clientGradient)"
                dot={{ r: 3.5, fill: "hsl(195 27% 49%)", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "hsl(195 27% 49%)", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

                {/* Territory Map */}
                <TerritoryMap />
      </div>
    </AppLayout>
  );
}
