import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MOCK_PROSPECTS, type ProspectStatus, type Prospect } from "@/lib/mock-data";
import { Building2, TrendingUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateProspectWizard } from "@/components/CreateProspectWizard";

const STATUS_STYLES: Record<ProspectStatus, string> = {
  "Verbal":           "bg-sky-100    text-sky-700    border-sky-200",
  "In Communication": "bg-teal-100   text-teal-700   border-teal-200",
  "Awaiting Review":  "bg-amber-100  text-amber-700  border-amber-200",
  "Pending":          "bg-orange-100 text-orange-700 border-orange-200",
};

const ALL_STATUSES: ProspectStatus[] = ["Verbal", "In Communication", "Awaiting Review", "Pending"];

export default function Pipeline() {
  const [prospects, setProspects] = useState<Prospect[]>([...MOCK_PROSPECTS]);
  const [activeFilter, setActiveFilter] = useState<ProspectStatus | "All">("All");
  const [showWizard, setShowWizard] = useState(false);

  const filtered = activeFilter === "All"
    ? prospects
    : prospects.filter(p => p.status === activeFilter);

  const countByStatus = (s: ProspectStatus) => prospects.filter(p => p.status === s).length;

  function handleCreated(prospect: Prospect) {
    setProspects(prev => [prospect, ...prev]);
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {ALL_STATUSES.map(status => (
            <div key={status} className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <p className="text-xs text-muted-foreground font-medium mb-1">{status}</p>
              <p className="text-2xl font-bold text-foreground">{countByStatus(status)}</p>
            </div>
          ))}
        </div>

        {/* Filter bar + table */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
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
            {ALL_STATUSES.map(s => (
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
                {s} ({countByStatus(s)})
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground font-semibold border-b border-border/50">
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5 text-right">Units</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-sm text-foreground">{p.companyName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-muted-foreground">{p.location}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-foreground">{p.unitCount.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        "inline-block px-2.5 py-1 rounded-full text-xs font-bold border",
                        STATUS_STYLES[p.status]
                      )}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-16 text-center text-muted-foreground text-sm">
                No prospects with status "{activeFilter}"
              </div>
            )}
          </div>
        </div>
      </div>

      {showWizard && (
        <CreateProspectWizard
          onClose={() => setShowWizard(false)}
          onCreated={p => { handleCreated(p); }}
        />
      )}
    </AppLayout>
  );
}
