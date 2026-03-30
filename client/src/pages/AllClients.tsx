import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Building, Building2, Filter, Search, Globe, Users, ArrowUpDown, ArrowUp, ArrowDown, Plus, X } from "lucide-react";
import { cn, getAvatarColor } from "@/lib/utils";
import { useClients } from "@/context/ClientsContext";
import { AddClientWizard } from "@/components/AddClientWizard";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { MOCK_CLIENT_REPS } from "@/data/mock_client_reps";
import {getInitials} from '@/helpers/formatters'

type SortField = "companyName" | "unitCount" | null;
type SortDir = "asc" | "desc";
type AdvancedFilters = {
  repId: string;
  state: string;
  minUnitsThousands: number | null;
};

const DEFAULT_FILTERS: AdvancedFilters = {
  repId: "all",
  state: "all",
  minUnitsThousands: null,
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

export default function AllClients() {
  const { allClients } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showWizard, setShowWizard] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);

  const displayActiveReps = 9;
  const totalUnits = allClients.reduce((sum, c) => sum + c.unitCount, 0);

  const stateOptions = Array.from(
    new Set(
      allClients
        .map((client) => client.address.state)
    ),
  ).sort((a, b) => a.localeCompare(b));

  const filtered = allClients.filter(c =>
    (c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientId.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (advancedFilters.repId === "all" || c.assignedRepId === advancedFilters.repId) &&
    (advancedFilters.state === "all" || c.address.state === advancedFilters.state) &&
    (advancedFilters.minUnitsThousands === null || c.unitCount >= advancedFilters.minUnitsThousands * 1000)
  );

  const filteredClients = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    let valA: string | number = sortField === "companyName" ? a.companyName : a.unitCount;
    let valB: string | number = sortField === "companyName" ? b.companyName : b.unitCount;
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

  function openAdvancedFilter() {
    setDraftFilters(advancedFilters);
    setShowAdvancedFilter(true);
  }

  function applyAdvancedFilters() {
    setAdvancedFilters(draftFilters);
    setShowAdvancedFilter(false);
  }

  function resetAdvancedFilters() {
    setDraftFilters(DEFAULT_FILTERS);
    setAdvancedFilters(DEFAULT_FILTERS);
    setShowAdvancedFilter(false);
  }

  function clearSavedFilter(key: keyof AdvancedFilters) {
    const nextFilters = { ...advancedFilters, [key]: DEFAULT_FILTERS[key] };
    setAdvancedFilters(nextFilters);
    setDraftFilters(nextFilters);
  }

  const minUnitsLabel = `${(draftFilters.minUnitsThousands ?? 1).toLocaleString()}k`;
  const activeFilterLabels = [
    advancedFilters.repId !== "all"
      ? {
          key: "repId" as const,
          label: `Rep: ${MOCK_CLIENT_REPS.find((rep) => rep.id === advancedFilters.repId)?.firstName}`,
        }
      : null,
    advancedFilters.state !== "all"
      ? {
          key: "state" as const,
          label: `State: ${advancedFilters.state}`,
        }
      : null,
    advancedFilters.minUnitsThousands !== null
      ? {
          key: "minUnitsThousands" as const,
          label: `Min Units: ${advancedFilters.minUnitsThousands.toLocaleString()}k`,
        }
      : null,
  ].filter((filter): filter is { key: keyof AdvancedFilters; label: string } => Boolean(filter));

  const stats = [
    { label: "Total Clients", value: allClients.length, icon: Building2, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Total Units", value: totalUnits.toLocaleString(), icon: Building, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Active Reps", value: displayActiveReps, icon: Users, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  return (
    <AppLayout>
      {showWizard && <AddClientWizard onClose={() => setShowWizard(false)} />}
      <Dialog open={showAdvancedFilter} onOpenChange={setShowAdvancedFilter}>
        <DialogContent className="sm:max-w-xl rounded-3xl border-border p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-2xl font-display font-bold">Advanced Filters</DialogTitle>
            <DialogDescription>
              Narrow the client list by sales rep, operating state, and minimum unit count.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Sales Rep</label>
                <Select
                  value={draftFilters.repId}
                  onValueChange={(value) => setDraftFilters((current) => ({ ...current, repId: value }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-border bg-card">
                    <SelectValue placeholder="All sales reps" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sales reps</SelectItem>
                    {MOCK_CLIENT_REPS.map((rep) => (
                      <SelectItem key={rep.id} value={rep.id}>
                        {rep.firstName} {rep.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">State Of Operation</label>
                <Select
                  value={draftFilters.state}
                  onValueChange={(value) => setDraftFilters((current) => ({ ...current, state: value }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-border bg-card">
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All states</SelectItem>
                    {stateOptions.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Minimum Unit Count</p>
                  <p className="text-sm text-muted-foreground">Select a threshold from 1,000 to 50,000 units.</p>
                </div>
                <div className="rounded-xl bg-background px-3 py-2 text-sm font-bold text-primary shadow-sm border border-border">
                  {minUnitsLabel}
                </div>
              </div>

              <Slider
                value={[draftFilters.minUnitsThousands ?? 1]}
                min={1}
                max={50}
                step={1}
                onValueChange={([value]) =>
                  setDraftFilters((current) => ({ ...current, minUnitsThousands: value }))
                }
              />

              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>1k</span>
                <span>25k</span>
                <span>50k</span>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border bg-muted/10 px-6 py-4 sm:justify-between">
            <button
              type="button"
              onClick={resetAdvancedFilters}
              className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={applyAdvancedFilters}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Save Filters
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">All Clients</h1>
          <p className="text-muted-foreground mt-1 text-lg">Directory of all active accounts across the sales team.</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card rounded-2xl p-6 border border-border shadow-sm flex items-center gap-5 hover-elevate">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-7 h-7", stat.color)} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-display font-bold text-foreground mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

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
          <button
            onClick={openAdvancedFilter}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground border border-secondary-border font-medium hover:bg-secondary/80 transition-colors shadow-sm"
          >
            <Filter className="w-4 h-4" />
            Advanced Filter
          </button>
        </div>

        {activeFilterLabels.length > 0 && (
          <div className="px-4 py-3 border-b border-border/50 flex flex-wrap items-center gap-2 bg-background">
            {activeFilterLabels.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              >
                {filter.label}
                <button
                  type="button"
                  onClick={() => clearSavedFilter(filter.key)}
                  className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full text-primary/70 transition-colors hover:bg-primary/15 hover:text-primary"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="max-h-[65vh] overflow-x-auto overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                  <button onClick={() => handleSort("companyName")} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    Company Name
                    <SortIcon field="companyName" activeField={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-muted/80">Client ID</th>
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-muted/80">Headquarters</th>
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 text-right backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                  <button onClick={() => handleSort("unitCount")} className="flex items-center gap-1.5 ml-auto hover:text-foreground transition-colors">
                    Unit Count
                    <SortIcon field="unitCount" activeField={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 text-center backdrop-blur supports-[backdrop-filter]:bg-muted/80">Assigned Rep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredClients.map((client) => {
                const rep = MOCK_CLIENT_REPS.find(rep=> rep.id === client.assignedRepId)
                const repInitials = getInitials(rep.firstName,rep.lastName)
                const avatarColorClass = getAvatarColor(repInitials);

                return (
                  <tr key={client.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4">
                      <Link
                        to={`/clients/${client.id}?from=all-clients`}
                        className="font-bold text-foreground text-base hover:text-primary hover:underline transition-colors"
                      >
                        {client.companyName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{client.clientId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="w-4 h-4 opacity-50" />
                        {client.address.city}, {client.address.state}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-foreground">{client.unitCount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center relative group/tooltip">
                        <Link
                          to={`/rep/${client.assignedRepId}?from=all-clients`}
                          className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 shadow-sm transition-all hover:scale-110 hover:ring-2 hover:ring-primary/40", avatarColorClass)}
                        >
                          {repInitials}
                        </Link>
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-foreground text-background text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                            {rep.firstName} {rep.lastName}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No clients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
