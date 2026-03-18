import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Building, Building2, Filter, Search, Globe, Users, ArrowUpDown, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { cn, getAvatarColor } from "@/lib/utils";
import { useClients } from "@/context/ClientsContext";
import { AddClientWizard } from "@/components/AddClientWizard";

type SortField = "companyName" | "unitCount" | null;
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

export default function AllClients() {
  const { allClients } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showWizard, setShowWizard] = useState(false);

  const displayActiveReps = 9;
  const totalUnits = allClients.reduce((sum, c) => sum + c.unitCount, 0);

  const filtered = allClients.filter(c =>
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.clientId.toLowerCase().includes(searchTerm.toLowerCase())
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

  const stats = [
    { label: "Total Clients", value: allClients.length, icon: Building2, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Total Units", value: totalUnits.toLocaleString(), icon: Building, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Active Reps", value: displayActiveReps, icon: Users, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  return (
    <AppLayout>
      {showWizard && <AddClientWizard onClose={() => setShowWizard(false)} />}

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

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
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
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground border border-secondary-border font-medium hover:bg-secondary/80 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Advanced Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="px-6 py-4">
                  <button onClick={() => handleSort("companyName")} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    Company Name
                    <SortIcon field="companyName" activeField={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="px-6 py-4">Client ID</th>
                <th className="px-6 py-4">Headquarters</th>
                <th className="px-6 py-4 text-right">
                  <button onClick={() => handleSort("unitCount")} className="flex items-center gap-1.5 ml-auto hover:text-foreground transition-colors">
                    Unit Count
                    <SortIcon field="unitCount" activeField={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="px-6 py-4 text-center">Assigned Rep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredClients.map((client) => {
                const repInitials = client.assignedRep?.initials || "?";
                const repName = `${client.assignedRep?.firstName} ${client.assignedRep?.lastName}`;
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
                        {client.headquarters}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-foreground">{client.unitCount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center relative group/tooltip">
                        <Link
                          to={`/rep/${client.assignedRep?.id}?from=all-clients`}
                          className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 shadow-sm transition-all hover:scale-110 hover:ring-2 hover:ring-primary/40", avatarColorClass)}
                        >
                          {repInitials}
                        </Link>
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-foreground text-background text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                            {repName}
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
