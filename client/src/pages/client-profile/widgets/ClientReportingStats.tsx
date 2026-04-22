import { useMemo, useState } from "react";
import { BarChart2, CalendarDays, Check, FileText, Gauge, TrendingUp } from "lucide-react";
import type { Client } from "@/types/api";
import { ModalContainer } from "@/components/shared/ModalContainer";
import CustomSelect from "@/components/shared/CustomSelect";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  buildPlacementMonths,
  buildReportingRows,
  calculatePlacementChange,
} from "../reportingUtils";

const REPORTING_YEARS = ["2026", "2025", "2024", "2023", "2022"];
const REPORT_TYPES = [{ value: "inventory", label: "Inventory Report" },{ value: "summary", label: "Summary Report" }];

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
  const [averageIqsYear, setAverageIqsYear] = useState("2026");
  const [placementsThisMonthYear, setPlacementsThisMonthYear] = useState("2026");
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

  const averageIqs = useMemo(() => {
    const selectedYear = Number(averageIqsYear);
    const rows = buildReportingRows(client).filter(
      (row) => row.datePlacedValue.getFullYear() === selectedYear
    );
    const total = rows.reduce((sum, row) => sum + row.iqs, 0);

    return rows.length ? Math.round(total / rows.length) : 0;
  }, [client, averageIqsYear]);

  const placementsThisMonth = useMemo(() => {
    const months = buildPlacementMonths(client, placementsThisMonthYear);
    const selectedYear = Number(placementsThisMonthYear);
    const currentMonthIndex = new Date().getMonth();
    const monthEntry = months.find(
      (month) =>
        month.monthDate.getFullYear() === selectedYear
        && month.monthDate.getMonth() === currentMonthIndex
    );

    return monthEntry?.placements ?? 0;
  }, [client, placementsThisMonthYear]);

  const placementsThisMonthLabel = useMemo(() => {
    const currentMonth = new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(2026, new Date().getMonth(), 1));
    return `${currentMonth} placements for ${placementsThisMonthYear}`;
  }, [placementsThisMonthYear]);

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
        <ReportingStatCard
          icon={CalendarDays}
          label="Placements This Month"
          value={placementsThisMonth.toLocaleString()}
          sub={placementsThisMonthLabel}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          selectedYear={placementsThisMonthYear}
          onYearChange={setPlacementsThisMonthYear}
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


        <ReportingStatCard
          icon={Gauge}
          label="Average IQS"
          value={averageIqs}
          sub={`Average IQS for accounts placed in ${averageIqsYear}`}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          selectedYear={averageIqsYear}
          onYearChange={setAverageIqsYear}
        />
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
        />
      </div>

      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="sm:max-w-md border-none bg-transparent p-0 shadow-none [&>button]:hidden">
          <ModalContainer
            title="Generate Report"
            description={`Choose the report type for ${client.companyName}.`}
            onClose={() => setShowReportModal(false)}
            primaryAction={{ label: "Generate Report", onClick: () => setShowReportModal(false) }}
            secondaryAction={{ label: "Cancel", onClick: () => setShowReportModal(false) }}
            bodyClassName="space-y-5"
          >
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Report Type
            </label>
            <CustomSelect
              value={reportType}
              onChange={setReportType}
              options={REPORT_TYPES}
              placeholder="Select a report type"
            />
          </ModalContainer>
        </DialogContent>
      </Dialog>
    </div>
  );
}
