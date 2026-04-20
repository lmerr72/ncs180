import { useMemo, useState } from "react";
import { BarChart2, CalendarDays, Check, FileText, TrendingUp } from "lucide-react";
import type { Client } from "@/types/api";
import CustomSelect from "@/components/shared/CustomSelect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const REPORTING_YEARS = ["2026", "2025", "2024", "2023", "2022"];
const REPORT_TYPES = [{ value: "inventory", label: "Inventory Report" },{ value: "summary", label: "Summary Report" }];

type PlacementMonth = {
  monthDate: Date;
  placements: number;
};

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getClientSeed(client: Client): number {
  return Array.from(client.id || client.companyName).reduce((total, char) => total + char.charCodeAt(0), 0);
}

function buildPlacementMonths(client: Client, selectedYear: string): PlacementMonth[] {
  const year = Number(selectedYear);
  const periodEnd = new Date(year, 11, 1);
  const unitCount = Math.max(client.unitCount ?? 0, 0);
  const seed = getClientSeed(client);

  return Array.from({ length: 15 }, (_, index) => {
    const monthDate = addMonths(periodEnd, index - 14);
    const percent = 5 + ((seed + index * 37 + monthDate.getMonth() * 11 + monthDate.getFullYear()) % 26);
    const placements = Math.round(unitCount * (percent / 100));

    return { monthDate, placements };
  });
}

function calculatePlacementChange(months: PlacementMonth[]): number {
  const currentWindow = months.slice(-3);
  const priorWindow = months.slice(-6, -3);
  const currentTotal = currentWindow.reduce((total, month) => total + month.placements, 0);
  const priorTotal = priorWindow.reduce((total, month) => total + month.placements, 0);

  if (priorTotal === 0) return currentTotal > 0 ? 100 : 0;

  return Math.round(((currentTotal - priorTotal) / priorTotal) * 100);
}

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
        {REPORTING_YEARS.map((year) => (
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

function ReportingStatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconColor,
  iconBg,
  selectedYear,
  onYearChange,
  children,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconColor: string;
  iconBg: string;
  selectedYear: string;
  onYearChange: (year: string) => void;
  children?: React.ReactNode;
}) {
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
      {children}
    </div>
  );
}

export function ClientReportingStats({ client }: { client: Client }) {
  const [rollingAverageYear, setRollingAverageYear] = useState("2026");
  const [totalPlacementsYear, setTotalPlacementsYear] = useState("2026");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("inventory");

  const rollingAverage = useMemo(() => {
    const months = buildPlacementMonths(client, rollingAverageYear).slice(-12);
    const total = months.reduce((sum, month) => sum + month.placements, 0);

    return months.length ? Math.round(total / months.length) : 0;
  }, [client, rollingAverageYear]);

  const totalPlacementStats = useMemo(() => {
    const months = buildPlacementMonths(client, totalPlacementsYear);
    const selectedYear = Number(totalPlacementsYear);
    const totalPlacements = months
      .filter((month) => month.monthDate.getFullYear() === selectedYear)
      .reduce((total, month) => total + month.placements, 0);
    const change = calculatePlacementChange(months);

    return { totalPlacements, change };
  }, [client, totalPlacementsYear]);

  const changeLabel = totalPlacementStats.change >= 0
    ? `Up ${totalPlacementStats.change}% over the last 3 months`
    : `Down ${Math.abs(totalPlacementStats.change)}% over the last 3 months`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Reporting</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Generate client reports and review placement trends.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <FileText className="h-4 w-4" />
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <ReportingStatCard
          icon={TrendingUp}
          label="12 Month Rolling Average"
          value={rollingAverage.toLocaleString()}
          sub={`Average monthly placements for ${rollingAverageYear}`}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          selectedYear={rollingAverageYear}
          onYearChange={setRollingAverageYear}
        />

        <ReportingStatCard
          icon={BarChart2}
          label="Total Placements"
          value={totalPlacementStats.totalPlacements.toLocaleString()}
          sub={`Total placements during ${totalPlacementsYear}`}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          selectedYear={totalPlacementsYear}
          onYearChange={setTotalPlacementsYear}
        >
          <p
            className={cn(
              "mt-3 text-xs font-bold",
              totalPlacementStats.change >= 0 ? "text-emerald-600" : "text-red-600"
            )}
          >
            {changeLabel}
          </p>
        </ReportingStatCard>
      </div>

      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-display font-bold">Generate Report</DialogTitle>
            <DialogDescription>
              Choose the report type for {client.companyName}.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Report Type
            </label>
            <CustomSelect
              value={reportType}
              onChange={setReportType}
              options={REPORT_TYPES}
              placeholder="Select a report type"
            />
          </div>

          <DialogFooter className="border-t border-border bg-muted/10 px-6 py-4">
            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Generate Report
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
