import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Building2, TrendingUp, Plus, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateProspectWizard } from "@/components/CreateProspectWizard";
import { Prospect,ProspectStatus } from "@/types/api";
import { ProspectStatuses } from "@/types/constants";
import {  formatLabel } from "@/helpers/formatters";
import { SimpleStatCard } from "@/components/shared/SimpleStatCard";
import { getProspectClients } from "@/services/clientService";

const STATUS_STYLES: Record<ProspectStatus, string> = {
  "not_started":          "bg-orange-100 text-orange-700 border-orange-200",
  "in_communication": "bg-teal-100   text-teal-700   border-teal-200",
  "verbal":           "bg-sky-100    text-sky-700    border-sky-200",
  "awaiting_review":  "bg-amber-100  text-amber-700  border-amber-200",
  "onboarding":       "bg-violet-100 text-violet-700 border-violet-200",
  "closed":"bg-gray-100 text-gray-700 border-gray-200",
  "inactive":"bg-slate-100 text-slate-600 border-slate-200"
};

type SortField = "companyName" | "unitCount" | "prospectStatus" | null;
type SortDir = "asc" | "desc";

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


export default function Pipeline() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ProspectStatus | "All">("All");
  const [showWizard, setShowWizard] = useState(false);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    let ignore = false;

    async function loadProspects() {
      setLoading(true);
      try {
        const nextProspects = await getProspectClients();
        if (!ignore) {
          setProspects(nextProspects);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadProspects();

    return () => {
      ignore = true;
    };
  }, []);

  const filtered = activeFilter === "All"
    ? prospects
    : prospects.filter(p => p.prospectStatus === activeFilter);

  const filteredProspects = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    const valA: string | number = sortField === "companyName" ? a.companyName : a.unitCount;
    const valB: string | number = sortField === "companyName" ? b.companyName : b.unitCount;

    if (typeof valA === "string" && typeof valB === "string") {
      return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    return sortDir === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
  });

  const countByStatus = (s: ProspectStatus) => prospects.filter(p => p.prospectStatus === s).length;

  function handleSort(field: SortField) {
    const next = nextSort(field, sortField, sortDir);
    setSortField(next.field);
    setSortDir(next.dir);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Pipeline</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track and manage your active prospects</p>
            </div>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Prospect
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ProspectStatuses.map(status => (
           <SimpleStatCard
              key={status}
              label={status}
              value={countByStatus(status)}
            />
          ))}
        </div>

        {/* Filter bar + table */}
        <div className="mb-4 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Filter chips */}
          <div className="px-5 py-3.5 border-b border-border/50 bg-muted/20 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveFilter("All")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                activeFilter === "All"
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              All ({prospects.length})
            </button>
            {ProspectStatuses.map(s => (
              <button
                key={s}
                onClick={() => setActiveFilter(s)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                  activeFilter === s
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}
              >
                {formatLabel(s)} ({countByStatus(s)})
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="max-h-[65vh] overflow-x-auto overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground font-semibold border-b border-border/50">
                  <th className="sticky top-0 z-10 bg-muted/95 px-5 py-3.5 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                    <button onClick={() => handleSort("companyName")} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                      Company
                      <SortIcon field="companyName" activeField={sortField} dir={sortDir} />
                    </button>
                  </th>
                  <th className="sticky top-0 z-10 bg-muted/95 px-5 py-3.5 backdrop-blur supports-[backdrop-filter]:bg-muted/80">Location</th>
                  <th className="sticky top-0 z-10 bg-muted/95 px-5 py-3.5 text-right backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                    <button onClick={() => handleSort("unitCount")} className="ml-auto flex items-center gap-1.5 hover:text-foreground transition-colors">
                      Units
                      <SortIcon field="unitCount" activeField={sortField} dir={sortDir} />
                    </button>
                  </th>
                  <th className="sticky top-0 z-10 bg-muted/95 px-5 py-3.5 backdrop-blur supports-[backdrop-filter]:bg-muted/80"><button onClick={() => handleSort("prospectStatus")} className="ml-auto flex items-center gap-1.5 hover:text-foreground transition-colors">
                      Status
                      <SortIcon field="unitCount" activeField={sortField} dir={sortDir} />
                    </button></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredProspects.map(p => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <Link
                          to={`/clients/${p.id}?from=pipeline`}
                          state={{ prospect: p }}
                          className="font-semibold text-sm text-foreground hover:text-primary hover:underline transition-colors"
                        >
                          {p.companyName}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-muted-foreground">{p.address.city}, {p.address.state}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-foreground">{p.unitCount.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        "inline-block px-2.5 py-1 rounded-full text-xs font-bold border",
                        STATUS_STYLES[p.prospectStatus]
                      )}>
                        {formatLabel(p.prospectStatus)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProspects.length === 0 && (
              <div className="py-16 text-center text-muted-foreground text-sm">
                {loading ? "Loading prospects..." : `No prospects with status "${activeFilter}"`}
              </div>
            )}
          </div>
        </div>
      </div>

      {showWizard && (
        <CreateProspectWizard onClose={() => setShowWizard(false)} />
      )}
    </AppLayout>
  );
}
