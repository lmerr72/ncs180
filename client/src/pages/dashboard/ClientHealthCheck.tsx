import { Link } from "react-router-dom";
import { AlertTriangle, FileWarning, HeartPulse, ShieldAlert, TrendingDown } from "lucide-react";
import DashboardWidgetContainer from "./DashboardWidgetContainer";

type ClientHealthCheckItem = {
  id: string;
  clientId: string;
  clientName: string;
  issue: string;
  detail: string;
  icon: typeof AlertTriangle;
  tone: string;
};

const MOCK_CLIENT_HEALTH_CHECKS: ClientHealthCheckItem[] = [
  {
    id: "flagged-client",
    clientId: "health-check-1",
    clientName: "Silver Oak Recovery",
    issue: "Flagged client",
    detail: "Compliance review was reopened after recent account activity.",
    icon: ShieldAlert,
    tone: "bg-red-100 text-red-700 border-red-200"
  },
  {
    id: "no-placement-year",
    clientId: "health-check-2",
    clientName: "Northwind Legal Group",
    issue: "No placements in 12 months",
    detail: "Last file placement was recorded on April 3, 2025.",
    icon: TrendingDown,
    tone: "bg-amber-100 text-amber-700 border-amber-200"
  },
  {
    id: "low-recovery-rate",
    clientId: "health-check-3",
    clientName: "Pioneer Credit Partners",
    issue: "Recovery rate below 10%",
    detail: "Trailing recovery rate is 8.4% across the last 90 days.",
    icon: HeartPulse,
    tone: "bg-orange-100 text-orange-700 border-orange-200"
  },
  {
    id: "signed-no-file",
    clientId: "health-check-4",
    clientName: "Blue Mesa Residential",
    issue: "Signed agreement, no first file",
    detail: "Agreement was signed on March 28, 2026 and onboarding is still pending.",
    icon: FileWarning,
    tone: "bg-sky-100 text-sky-700 border-sky-200"
  }
];

export default function ClientHealthCheck() {
  return (
    <DashboardWidgetContainer
      title="Client Health Check"
      icon={<AlertTriangle className="w-4 h-4 text-primary" />}
      headerActions={(
        <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-primary/10 text-primary">
          {MOCK_CLIENT_HEALTH_CHECKS.length}
        </span>
      )}
    >
      <div className="divide-y divide-border/40">
        {MOCK_CLIENT_HEALTH_CHECKS.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              to={`/clients/${item.clientId}`}
              className="block px-4 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.clientName}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${item.tone}`}>
                      {item.issue}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.detail}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </DashboardWidgetContainer>
  );
}
