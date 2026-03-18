import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MOCK_MY_CLIENTS } from "@/lib/mock-data";
import { BarChart3, Users, UserMinus, TrendingUp, MapPin } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { ComposableMap, Geographies, Geography } from "@vnedyalk0v/react19-simple-maps";
import { STATE_TERRITORIES, type RepKey } from "@/lib/mock-data";

// ── Territory data ──────────────────────────────────────────────────────────

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface RepInfo {
  name: string;
  color: string;
  textColor: string;
  label: string;
}

const REPS: Record<RepKey, RepInfo> = {
  gordon:  { name: "Gordon Marshall", color: "#3B82F6", textColor: "#fff", label: "Gordon Marshall" },
  tina:    { name: "Tina Smith",      color: "#8B5CF6", textColor: "#fff", label: "Tina Smith"      },
  pete:    { name: "Pete Mitchell",   color: "#F97316", textColor: "#fff", label: "Pete Mitchell"   },
  heath:   { name: "Heath Lindsey",   color: "#10B981", textColor: "#fff", label: "Heath Lindsey"   },
  rod:     { name: "Rod Stewart",     color: "#EF4444", textColor: "#fff", label: "Rod Stewart"     },
  michael: { name: "Michael Scott",   color: "#F59E0B", textColor: "#fff", label: "Michael Scott"   },
  kim:     { name: "Kim Wexler",      color: "#EC4899", textColor: "#fff", label: "Kim Wexler"      },
  kristen: { name: "Kristen Bell",    color: "#06B6D4", textColor: "#fff", label: "Kristen Bell"    },
  gxavier: { name: "Gordon Xavier",   color: "#6366F1", textColor: "#fff", label: "Gordon Xavier"   },
  open:    { name: "Open Territory",  color: "#CBD5E1", textColor: "#475569", label: "Open"         },
};


function getRepKey(stateName: string): RepKey {
  return STATE_TERRITORIES[stateName] ?? "open";
}

// ── Chart data ───────────────────────────────────────────────────────────────

const ACTIVE_CLIENTS_HISTORY = [
  { year: "2016", clients: 45 }, { year: "2017", clients: 58 },
  { year: "2018", clients: 67 }, { year: "2019", clients: 82 },
  { year: "2020", clients: 71 }, { year: "2021", clients: 88 },
  { year: "2022", clients: 104 }, { year: "2023", clients: 119 },
  { year: "2024", clients: 138 }, { year: "2025", clients: 156 },
  { year: "2026", clients: 163 },
];

const TOTAL_INACTIVE = 27;
const avgRecoveryRate = (() => {
  const rates = MOCK_MY_CLIENTS.map(c => c.recoveryRate);
  return (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1);
})();
const activeCount = ACTIVE_CLIENTS_HISTORY[ACTIVE_CLIENTS_HISTORY.length - 1].clients;
const prevYearCount = ACTIVE_CLIENTS_HISTORY[ACTIVE_CLIENTS_HISTORY.length - 2].clients;
const yoyChange = activeCount - prevYearCount;

// ── Subcomponents ─────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, iconColor, iconBg }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  iconColor: string; iconBg: string;
}) {
  return (
    <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm p-6 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${iconBg} flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className="text-3xl font-bold text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

interface TooltipState { stateName: string; repKey: RepKey; x: number; y: number }

function TerritoryMap() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" />
        <h2 className="text-base font-bold text-foreground">Sales Territory Map</h2>
        <span className="text-xs text-muted-foreground ml-1">— hover a state for details</span>
      </div>

      <div className="p-4 relative">
        {/* Map */}
        <div className="relative select-none" style={{ touchAction: "none" }}>
          <ComposableMap
            projection="geoAlbersUsa"
            width={800}
            height={480}
            style={{ width: "100%", height: "auto" }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const stateName: string = geo.properties.name;
                  const repKey = getRepKey(stateName);
                  const rep = REPS[repKey];
                  const isHovered = hoveredState === stateName;

                  return (
                    <Geography
                      key={String(geo.id ?? stateName)}
                      geography={geo}
                      fill={isHovered ? darken(rep.color) : rep.color}
                      stroke="#ffffff"
                      strokeWidth={0.8}
                      style={{
                        default: { outline: "none", transition: "fill 120ms ease" },
                        hover:   { outline: "none", cursor: "pointer" },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={(e) => {
                        setHoveredState(stateName);
                        setTooltip({ stateName, repKey, x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => {
                        setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                      }}
                      onMouseLeave={() => {
                        setHoveredState(null);
                        setTooltip(null);
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {(Object.entries(REPS) as [RepKey, RepInfo][]).map(([key, rep]) => (
            <div key={key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-muted/20 text-xs font-medium">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: rep.color }} />
              <span className="text-foreground">{rep.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip — rendered as fixed overlay */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <div className="bg-popover border border-border rounded-xl shadow-xl px-3.5 py-2.5 min-w-[160px]">
            <p className="text-sm font-bold text-foreground mb-0.5">{tooltip.stateName}</p>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: REPS[tooltip.repKey].color }}
              />
              <p className="text-xs text-muted-foreground">{REPS[tooltip.repKey].name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function darken(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - 30);
  const g = Math.max(0, ((n >> 8) & 0xff) - 30);
  const b = Math.max(0, (n & 0xff) - 30);
  return `rgb(${r},${g},${b})`;
}

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

        {/* Territory Map */}
        <TerritoryMap />

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
      </div>
    </AppLayout>
  );
}
