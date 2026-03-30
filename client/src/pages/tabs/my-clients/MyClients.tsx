import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Users, Building, Building2, TrendingUp, Filter, Search, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DetailCard } from "@/components/shared/DetailCard";
import { Client } from "@/types/api";
import { daysFromToday } from "@/helpers/formatters";
import { useClients } from "@/context/ClientsContext";



type SortField = "companyName" | "unitCount" | "totalPlacements" | "placementsThisYear" | null;
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

function enrichClients() {

}

export default function MyClients() {
  const { myClients: assignedClients, loading } = useClients();
  const myClients = assignedClients.filter((client) => client.status !== "prospecting");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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

  const filtered = myClients.filter(c =>
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.clientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const stats = [
    { label: "Total Clients", value: totalClients, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Total Units", value: totalUnits.toLocaleString(), icon: Building2, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "New This Month", value: newThisMonth, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">My Clients</h1>
        <p className="text-muted-foreground mt-1 text-lg">Manage your active accounts and properties.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground border border-secondary-border font-medium hover:bg-secondary/80 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

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
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-muted/80">First Placement</th>
                <th className="sticky top-0 z-10 bg-muted/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-muted/80">Last Placement</th>
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
                const stale = client.mostRecentFilePlacementDate
                  ? daysFromToday(client.mostRecentFilePlacementDate) > 365
                  : false;
                return (
                  <tr key={client.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Building className="w-5 h-5" />
                        </div>
                        <Link
                          to={`/clients/${client.id}?from=my-clients`}
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
                        {stale && <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                        <span className={cn("font-medium", stale ? "text-red-600" : "text-muted-foreground")}>
                          {formatMonthYear(client.mostRecentFilePlacementDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-foreground">
                      0
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-foreground">
                      0
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                        "inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold",
                        "bg-slate-100 text-slate-700"
                      )}>
                        0.0%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                        bucketColors[1]
                      )}>
                        1
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
