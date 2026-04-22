import { useState } from "react";
import { MOCK_GOALS } from "@/lib/mock-data";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArrowUpRight, BarChart3, Percent, Target } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from "recharts";

type GoalProgressView = "percent" | "chart";

export default function QuarterlyGoalProgress() {
  const [view, setView] = useState<GoalProgressView>("percent");

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col relative z-0">
      <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/5 blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />

      <div className="px-4 py-3.5 border-b border-border/50 bg-muted/20 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Quarterly Goal Progress</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Q1 Sales Targets</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => {
              if (value) {
                setView(value as GoalProgressView);
              }
            }}
            variant="outline"
            size="sm"
            aria-label="Toggle goal progress view"
            className="rounded-lg border border-border bg-background p-0.5"
          >
            <ToggleGroupItem value="percent" aria-label="Show percent view" className="px-2.5">
              <Percent className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="chart" aria-label="Show chart view" className="px-2.5">
              <BarChart3 className="h-3.5 w-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {MOCK_GOALS.trend === "on_track" ? "On Track" : MOCK_GOALS.trend}
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {view === "percent" ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-[220px] aspect-square relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="72%"
                  outerRadius="100%"
                  barSize={16}
                  data={[{ name: "Progress", value: MOCK_GOALS.percentComplete }]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={10} fill="var(--color-primary)" />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-display font-bold text-foreground">{MOCK_GOALS.percentComplete}%</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">of Q1 Goal</span>
              </div>
            </div>

            <div className="mt-4 w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total files placed</p>
              <p className="mt-1 text-sm font-semibold text-foreground">147</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em] mb-3">
              Monthly Actual vs Target
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_GOALS.monthlyData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "var(--color-muted)", opacity: 0.2 }}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "var(--shadow-md)" }}
                  />
                  <Bar dataKey="target" fill="var(--color-muted)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    {MOCK_GOALS.monthlyData.map((entry, index) => (
                      <Cell
                        key={`goal-cell-${index}`}
                        fill="var(--color-primary)"
                        opacity={entry.actual >= entry.target ? 1 : 0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded bg-primary" />
                Actual
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded bg-muted" />
                Target
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
