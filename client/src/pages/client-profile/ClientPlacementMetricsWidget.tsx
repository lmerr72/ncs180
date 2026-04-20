import { BarChart2 } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Client } from "@/types/api";

type PlacementMetricPoint = {
  month: string;
  averagePlacements: number;
};

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getClientSeed(client: Client): number {
  return Array.from(client.id || client.companyName).reduce((total, char) => total + char.charCodeAt(0), 0);
}

function buildPlacementMetrics(client: Client): {
  data: PlacementMetricPoint[];
  rollingAverage: number;
  currentAverage: number;
} {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const unitCount = Math.max(client.unitCount ?? 0, 0);
  const seed = getClientSeed(client);

  const data = Array.from({ length: 12 }, (_, index) => {
    const monthDate = addMonths(currentMonth, index - 11);
    const percent = 5 + ((seed + index * 37 + monthDate.getMonth() * 11) % 26);
    const averagePlacements = Math.round(unitCount * (percent / 100));

    return {
      month: monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      averagePlacements,
    };
  });

  const rollingWindow = data.slice(-12);
  const rollingAverage = rollingWindow.length
    ? Math.round(rollingWindow.reduce((total, point) => total + point.averagePlacements, 0) / rollingWindow.length)
    : 0;
  const currentAverage = data.at(-1)?.averagePlacements ?? 0;

  return { data, rollingAverage, currentAverage };
}

function PlacementTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">
        <span className="font-bold text-foreground">{payload[0].value.toLocaleString()}</span> placements
      </p>
    </div>
  );
}

export function ClientPlacementMetricsWidget({ client }: { client: Client }) {
  const { data, rollingAverage, currentAverage } = buildPlacementMetrics(client);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border/50 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <BarChart2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Average Placements per Month</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Estimated monthly trend with a 12-month rolling average benchmark.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <div className="rounded-lg border border-border bg-background px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current</p>
            <p className="mt-0.5 text-lg font-bold leading-none text-foreground">{currentAverage.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-border bg-background px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">12 Mo Avg</p>
            <p className="mt-0.5 text-lg font-bold leading-none text-foreground">{rollingAverage.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="px-3 py-5 sm:px-5">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 12, right: 18, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              minTickGap={18}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <RechartsTooltip content={<PlacementTooltip />} />
            <ReferenceLine
              y={rollingAverage}
              stroke="hsl(38 92% 50%)"
              strokeDasharray="6 4"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="averagePlacements"
              name="Average placements"
              stroke="hsl(195 27% 49%)"
              strokeWidth={3}
              dot={{ r: 3, strokeWidth: 2, fill: "hsl(var(--card))" }}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 flex flex-wrap items-center gap-4 px-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-7 rounded-full bg-[hsl(195_27%_49%)]" />
            Average placements
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-7 rounded-full border-t-2 border-dashed border-amber-500" />
            12-month rolling average
          </span>
        </div>
      </div>
    </div>
  );
}
