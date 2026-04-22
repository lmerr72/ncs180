import type { ElementType } from "react";
import { Activity, AlertTriangle, CheckCircle2, PlugZap } from "lucide-react";
import { cn } from "@/lib/utils";

type IntegrationHealthStatus = "integrated" | "in_progress" | "broken";

type IntegrationHealthWidgetProps = {
  integration: string | null | undefined;
  status: IntegrationHealthStatus | null;
};

const HEALTH_CONFIG: Record<IntegrationHealthStatus, {
  label: string;
  description: string;
  progress: number;
  badgeClassName: string;
  barClassName: string;
  Icon: ElementType;
}> = {
  integrated: {
    label: "Integrated",
    description: "The integration is connected and healthy.",
    progress: 100,
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    barClassName: "bg-emerald-500",
    Icon: CheckCircle2,
  },
  in_progress: {
    label: "In Progress",
    description: "Setup is underway and still needs completion.",
    progress: 66,
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    barClassName: "bg-amber-500",
    Icon: Activity,
  },
  broken: {
    label: "Broken",
    description: "The integration is configured but needs attention.",
    progress: 25,
    badgeClassName: "border-red-200 bg-red-50 text-red-700",
    barClassName: "bg-red-500",
    Icon: AlertTriangle,
  },
};

function formatIntegrationName(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function IntegrationHealthWidget({
  integration,
  status,
}: IntegrationHealthWidgetProps) {
  const normalizedIntegration = integration?.trim() ?? "";

  if (!normalizedIntegration) {
    return (
      <div className="bg-card rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
          <PlugZap className="w-4 h-4 text-slate-600" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Integration Health</h2>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-muted/10 px-5 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">No integration setup</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add an integration in client details to start monitoring setup health.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const health = status ? HEALTH_CONFIG[status] : HEALTH_CONFIG.broken;
  const HealthIcon = health.Icon;

  return (
    <div className="bg-card rounded-2xl border border-sky-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-sky-100 bg-sky-50/70 flex items-center gap-2">
        <PlugZap className="w-4 h-4 text-sky-700" />
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Integration Health</h2>
      </div>
      <div className="px-6 py-5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Integration</p>
            <p className="mt-2 text-xl font-display font-semibold text-foreground">
              {formatIntegrationName(normalizedIntegration)}
            </p>
          </div>
          <div className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold",
            health.badgeClassName
          )}>
            <HealthIcon className="w-3.5 h-3.5" />
            {health.label}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{health.description}</p>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", health.barClassName)}
              style={{ width: `${health.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
