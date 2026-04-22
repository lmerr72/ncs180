import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Users, Building, Building2, TrendingUp, Filter, Search, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Compass, Sparkles, ExternalLink, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DetailCard } from "@/components/shared/DetailCard";
import { Client, UserProfile } from "@/types/api";
import { dateIsXDaysAgo } from "@/helpers/formatters";
import { MOCK_CLIENT_REPS } from "@/data/mock_client_reps";
import { useAuth } from "@/context/AuthContext";
import { getClients, getRepClients } from "@/services/clientService";
import { MyClientsFilterModal, type MyClientsFilters } from "./MyClientsFilterModal";

type SortField =
  | "companyName"
  | "unitCount"
  | "firstFilePlacementDate"
  | "mostRecentFilePlacementDate"
  | "totalPlacements"
  | "placementsThisYear"
  | null;
type SortDir = "asc" | "desc";

const DEFAULT_FILTERS: MyClientsFilters = {
  minUnitCount: null,
  bucket: "all",
  settledInFull: "all",
  integration: "all",
  integrationSetup: "all",
  taxCampaign: "all",
  minRecoveryRate: null,
};

function nextSort(field: SortField, currentField: SortField, currentDir: SortDir): { field: SortField; dir: SortDir } {
  if (currentField !== field) return { field, dir: "asc" };
  if (currentDir === "asc") return { field, dir: "desc" };
  return { field: null, dir: "asc" };
}

function SortIcon({ field, activeField, dir }: { field: SortField; activeField: SortField; dir: SortDir }) {
  if (activeField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
  return dir === "asc"
    ? <ArrowUp className="w-3.5 h-3.5 text-primary" />
    : <ArrowDown className="w-3.5 h-3.5 text-primary" />;
}

function formatMonthYear(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${mm}/${yy}`;
}



const bucketColors: Record<number, string> = {
  1: "bg-sky-100 text-sky-700 border border-sky-200",
  2: "bg-violet-100 text-violet-700 border border-violet-200",
  3: "bg-amber-100 text-amber-700 border border-amber-200",
};

type ApolloTerritoryOpportunity = {
  id: string;
  name: string;
  website: string;
  linkedIn: string;
  domain: string;
  state: string;
  city: string;
  location: string;
  industry: string;
  employeeCount: number | null;
};

type ApolloTerritoryResponse = {
  configured: boolean;
  territoryStates: string[];
  opportunities: ApolloTerritoryOpportunity[];
  warnings: string[];
  error?: string;
};

function resolveTerritoryStates(currentUser: UserProfile | null, myClients: Client[]) {
  if (currentUser) {
    const matchedRep = MOCK_CLIENT_REPS.find((rep) => (
      rep.firstName.toLowerCase() === currentUser.firstName.toLowerCase() &&
      rep.lastName.toLowerCase() === currentUser.lastName.toLowerCase()
    ));

    if (matchedRep?.territoryStates?.length) {
      return matchedRep.territoryStates;
    }
  }

  return Array.from(new Set(
    myClients
      .map((client) => client.address?.state)
      .filter((state): state is string => Boolean(state))
  )).slice(0, 6);
}

function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function getSortableDateValue(value: string | null | undefined): number {
  if (!value) return -1;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? -1 : timestamp;
}

function getClientBucket(client: Client): number{
  // return client.bucket ?? 1;
  return Math.floor(Math.random() * (3 - 1 + 1)) + 1;
}

function getClientRecoveryRate(client: Client): number {
  // hippo replace this
  // return client.recoveryRate ?? 0;
  return Math.floor(Math.random() * (25 - 0 + 1)) + 0;
}

export default function MyClients() {
  const { user: currentUser } = useAuth();
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [myClients, setMyClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [territoryData, setTerritoryData] = useState<ApolloTerritoryResponse | null>(null);
  const [territoryLoading, setTerritoryLoading] = useState(false);
  const [territoryError, setTerritoryError] = useState<string | null>(null);
  const [territoryRefreshKey, setTerritoryRefreshKey] = useState(0);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<MyClientsFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<MyClientsFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    let ignore = false;

    async function loadClients() {
      if (!currentUser?.repId) {
        if (!ignore) {
          setAllClients([]);
          setMyClients([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const [clients, repClients] = await Promise.all([
          getClients(),
          getRepClients(currentUser.repId),
        ]);

        if (ignore) return;

        setAllClients(clients);
        setMyClients(repClients.filter((client) =>
          client.clientStatus === "active" && client.prospectStatus !== "onboarding"
        ));
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadClients();

    return () => {
      ignore = true;
    };
  }, [currentUser?.repId]);

  const territoryStates = resolveTerritoryStates(currentUser, myClients);
  const territoryKey = territoryStates.join("|");
  const excludedCompanyNames = allClients.map((client) => client.companyName);
  const excludedDomains = allClients.map((client) => client.website || "");
  const excludedCompanyKey = excludedCompanyNames.join("|");
  const excludedDomainKey = excludedDomains.join("|");

  const totalClients = myClients.length;
  const totalUnits = myClients.reduce((sum, client) => sum + client.unitCount, 0);
  const newThisMonth = myClients.filter((client) => {
    const created = new Date(client.createdDate);
    const now = new Date();
    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  }).length;

  const filtered = myClients.filter((client) => {
    const searchMatches =
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.clientId.toLowerCase().includes(searchTerm.toLowerCase());

    const unitCountMatches = filters.minUnitCount === null || client.unitCount >= filters.minUnitCount;
    const bucketMatches = filters.bucket === "all" || getClientBucket(client) === Number(filters.bucket);
    const settledInFullMatches = filters.settledInFull === "all"
      || (filters.settledInFull === "active" ? client.metadata.settled_in_full > 0 : client.metadata.settled_in_full <= 0);
    const integrationMatches = filters.integration === "all"
      || (filters.integration === "none" ? !client.metadata.integration : client.metadata.integration === filters.integration);
    const integrationSetupMatches = filters.integrationSetup === "all"
      || (client.onboardingChecklist?.integration_setup ?? false) === (filters.integrationSetup === "yes");
    const taxCampaignMatches = filters.taxCampaign === "all"
      || client.metadata.tax_campaign === (filters.taxCampaign === "yes");
    const recoveryRateMatches = filters.minRecoveryRate === null || getClientRecoveryRate(client) >= filters.minRecoveryRate;

    return (
      searchMatches
      && unitCountMatches
      && bucketMatches
      && settledInFullMatches
      && integrationMatches
      && integrationSetupMatches
      && taxCampaignMatches
      && recoveryRateMatches
    );
  });

  const filteredClients = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    let valA: string | number;
    let valB: string | number;
    if (sortField === "companyName") {
      valA = a.companyName;
      valB = b.companyName;
    } else if (sortField === "unitCount") {
      valA = a.unitCount;
      valB = b.unitCount;
    } else if (sortField === "firstFilePlacementDate") {
      valA = getSortableDateValue(a.firstFilePlacementDate);
      valB = getSortableDateValue(b.firstFilePlacementDate);
    } else if (sortField === "mostRecentFilePlacementDate") {
      valA = getSortableDateValue(a.mostRecentFilePlacementDate);
      valB = getSortableDateValue(b.mostRecentFilePlacementDate);
    } else if (sortField === "totalPlacements") {
      valA = 0;
      valB = 0;
    } else {
      valA = 0;
      valB = 0;
    }
    if (typeof valA === "string" && typeof valB === "string") {
      return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortDir === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
  });

  function handleSort(field: SortField) {
    const next = nextSort(field, sortField, sortDir);
    setSortField(next.field);
    setSortDir(next.dir);
  }

  function openFilterModal() {
    setDraftFilters(filters);
    setShowFilterModal(true);
  }

  function applyFilters() {
    setFilters(draftFilters);
    setShowFilterModal(false);
  }

  function resetFilters() {
    setDraftFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setShowFilterModal(false);
  }

  function clearSavedFilter(key: keyof MyClientsFilters) {
    const nextFilters = { ...filters, [key]: DEFAULT_FILTERS[key] };
    setFilters(nextFilters);
    setDraftFilters(nextFilters);
  }

  useEffect(() => {
    let ignore = false;

    async function loadTerritoryOpportunities() {
      if (territoryStates.length === 0) {
        setTerritoryData(null);
        setTerritoryError(null);
        return;
      }

      setTerritoryLoading(true);
      setTerritoryError(null);

      try {
        const response = await fetch("/api/apollo/territory-opportunities", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            territoryStates,
            excludedCompanyNames,
            excludedDomains,
            limit: 6,
          }),
        });
        const payload = (await response.json()) as ApolloTerritoryResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load Apollo territory opportunities.");
        }

        if (!ignore) {
          setTerritoryData(payload);
        }
      } catch (error) {
        if (!ignore) {
          setTerritoryError(error instanceof Error ? error.message : "Unable to load Apollo territory opportunities.");
          setTerritoryData(null);
        }
      } finally {
        if (!ignore) {
          setTerritoryLoading(false);
        }
      }
    }

    void loadTerritoryOpportunities();

    return () => {
      ignore = true;
    };
  }, [territoryKey, excludedCompanyKey, excludedDomainKey, territoryRefreshKey]);

  const stats = [
    { label: "Total Clients", value: totalClients, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Total Units", value: totalUnits.toLocaleString(), icon: Building2, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "New This Month", value: newThisMonth, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];
  const activeFilterLabels = [
    filters.minUnitCount !== null
      ? { key: "minUnitCount" as const, label: `Units >= ${filters.minUnitCount.toLocaleString()}` }
      : null,
    filters.bucket !== "all"
      ? { key: "bucket" as const, label: `Bucket ${filters.bucket}` }
      : null,
    filters.settledInFull !== "all"
      ? { key: "settledInFull" as const, label: `Settled: ${filters.settledInFull}` }
      : null,
    filters.integration !== "all"
      ? {
          key: "integration" as const,
          label: `Integration: ${filters.integration === "none" ? "None" : filters.integration.replace(/_/g, " ")}`,
        }
      : null,
    filters.integrationSetup !== "all"
      ? { key: "integrationSetup" as const, label: `Setup: ${filters.integrationSetup}` }
      : null,
    filters.taxCampaign !== "all"
      ? { key: "taxCampaign" as const, label: `Tax campaign: ${filters.taxCampaign}` }
      : null,
    filters.minRecoveryRate !== null
      ? { key: "minRecoveryRate" as const, label: `Recovery >= ${filters.minRecoveryRate}%` }
      : null,
  ].filter((filter): filter is { key: keyof MyClientsFilters; label: string } => Boolean(filter));

  return (
    <AppLayout>
      <MyClientsFilterModal
        open={showFilterModal}
        filters={draftFilters}
        onChange={setDraftFilters}
        onOpenChange={setShowFilterModal}
        onApply={applyFilters}
        onReset={resetFilters}
      />
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">My Clients</h1>
        <p className="text-muted-foreground mt-1 text-lg">Manage your active accounts and properties.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8">
        {stats.map((stat, i) => (
          <DetailCard 
            icon={stat.icon}
            label={stat.label}
            value={stat.value.toString()}
            color={stat.color}
            bg={stat.bg}
          />
        
        ))}
      </div>

      {/* <div className="mb-8 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border/60 bg-muted/10 p-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Territory Opportunities</h2>
                <p className="text-sm text-muted-foreground">
                  Apollo-sourced organizations in your coverage states that are not already in the client list.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {territoryStates.length > 0 ? territoryStates.map((state) => (
                <span
                  key={state}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                >
                  {state}
                </span>
              )) : (
                <span className="text-sm text-muted-foreground">No territory states mapped yet.</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setTerritoryRefreshKey((current) => current + 1);
            }}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            disabled={territoryLoading || territoryStates.length === 0}
          >
            <RefreshCw className={cn("h-4 w-4", territoryLoading && "animate-spin")} />
            Refresh
          </button>
        </div>

        <div className="p-5">
          {territoryError ? (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{territoryError}</span>
            </div>
          ) : territoryLoading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="mb-3 h-4 w-2/3 rounded bg-muted" />
                  <div className="mb-2 h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : territoryData?.opportunities?.length ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                  <Sparkles className="h-4 w-4" />
                  {territoryData.opportunities.length} opportunities found
                </span>
                {territoryData.warnings.map((warning) => (
                  <span key={warning} className="text-amber-700">
                    {warning}
                  </span>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {territoryData.opportunities.map((opportunity) => (
                  <div key={opportunity.id} className="rounded-2xl border border-border/60 bg-background p-4 shadow-sm">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">{opportunity.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {opportunity.location || opportunity.state || "Location unavailable"}
                        </p>
                      </div>
                      {opportunity.website && (
                        <a
                          href={opportunity.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                          aria-label={`Open ${opportunity.name} website`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Industry</span>
                        <span className="font-medium text-foreground">{opportunity.industry || "Unknown"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Employees</span>
                        <span className="font-medium text-foreground">{formatCompactNumber(opportunity.employeeCount)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Domain</span>
                        <span className="font-medium text-foreground">{opportunity.domain || "—"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/10 px-4 py-5 text-sm text-muted-foreground">
              {territoryData?.warnings?.[0] || "Apollo did not return new territory opportunities yet."}
            </div>
          )}
        </div>
      </div> */}

      <div className="mb-4 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/10">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={resetFilters}
              disabled={activeFilterLabels.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-background text-foreground border border-border font-medium hover:bg-muted transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear Filters
            </button>
            <button
              onClick={openFilterModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground border border-secondary-border font-medium hover:bg-secondary/80 transition-colors shadow-sm"
            >
              <Filter className="w-4 h-4" />
              {activeFilterLabels.length > 0 ? `Filter (${activeFilterLabels.length})` : "Filter"}
            </button>
          </div>
        </div>
        {activeFilterLabels.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-border/50 px-4 pb-4">
            {activeFilterLabels.map((filter) => (
              <button
                type="button"
                key={filter.key}
                onClick={() => clearSavedFilter(filter.key)}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                aria-label={`Remove ${filter.label} filter`}
              >
                {filter.label}
                <X className="h-3 w-3 text-primary/70" />
              </button>
            ))}
          </div>
        )}

        <div className="max-h-[65vh] overflow-x-auto overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                  <button
                    onClick={() => handleSort("companyName")}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    Company Name
                    <SortIcon field="companyName" activeField={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-muted/80">Client ID</th>
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 text-right backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                  <button
                    onClick={() => handleSort("unitCount")}
                    className="flex items-center gap-1.5 ml-auto hover:text-foreground transition-colors"
                  >
                    Unit Count
                    <SortIcon field="unitCount" activeField={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                  <button
                    onClick={() => handleSort("firstFilePlacementDate")}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    First Placement
                    <SortIcon field="firstFilePlacementDate" activeField={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                  <button
                    onClick={() => handleSort("mostRecentFilePlacementDate")}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    Last Placement
                    <SortIcon field="mostRecentFilePlacementDate" activeField={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 text-right backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                  <button
                    onClick={() => handleSort("totalPlacements")}
                    className="flex items-center gap-1.5 ml-auto hover:text-foreground transition-colors"
                  >
                    Total Placements
                    <SortIcon field="totalPlacements" activeField={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 text-right backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                  <button
                    onClick={() => handleSort("placementsThisYear")}
                    className="flex items-center gap-1.5 ml-auto hover:text-foreground transition-colors"
                  >
                    Placements This Year
                    <SortIcon field="placementsThisYear" activeField={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 text-right backdrop-blur supports-[backdrop-filter]:bg-muted/80">Recovery Rate</th>
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 text-center backdrop-blur supports-[backdrop-filter]:bg-muted/80">Bucket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredClients.map((client:Client) => {
                const stale = dateIsXDaysAgo(client.mostRecentFilePlacementDate);
                const bucket = getClientBucket(client);
                const recoveryRate = getClientRecoveryRate(client);
                return (
                  <tr key={client.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Building className="w-5 h-5" />
                        </div>
                        <Link
                          to={`/clients/${client.id}?from=my-clients`}
                          state={{ client }}
                          className="font-bold text-foreground hover:text-primary hover:underline transition-colors"
                        >
                          {client.companyName}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-muted-foreground">
                      {client.clientId}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-full text-sm">
                        {client.unitCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatMonthYear(client.firstFilePlacementDate)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        
                        <span className={cn("font-medium", stale ? "text-amber-700" : "text-muted-foreground")}>
                          {formatMonthYear(client.mostRecentFilePlacementDate)}
                        </span>
                        {stale && <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-foreground">
                      0
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-foreground">
                      0
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                        "inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold",
                        "bg-slate-100 text-slate-700"
                      )}>
                        {recoveryRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                        bucketColors[bucket]
                      )}>
                        {bucket}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                    {loading ? "Loading clients..." : "No clients found matching your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
