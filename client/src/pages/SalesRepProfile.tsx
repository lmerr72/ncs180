import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useClients } from "@/context/ClientsContext";
import { MOCK_CLIENT_REPS } from "@/data/mock_client_reps";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Clock, Mail, ArrowLeft, ShieldCheck, Filter } from "lucide-react";
import { cn, getAvatarColor } from "@/lib/utils";

type RepAccountRow = {
  id: string;
  companyName: string;
  unitCount: number;
  totalPlacements: number;
  status: "prospecting" | "active" | "inactive";
  href: string;
};

const INACTIVE_THRESHOLD_DAYS = 365;

function getClientStatus(lastPlacementDate: string | null): "active" | "inactive" {
  if (!lastPlacementDate) return "inactive";
  const lastPlacement = new Date(lastPlacementDate);
  const now = new Date();
  const diffMs = now.getTime() - lastPlacement.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= INACTIVE_THRESHOLD_DAYS ? "active" : "inactive";
}

const STATUS_STYLES: Record<RepAccountRow["status"], string> = {
  prospecting: "bg-sky-100 text-sky-700 border-sky-200",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function SalesRepProfile() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { allClients, reps } = useClients();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showInactiveClients, setShowInactiveClients] = useState(false);
  const [draftShowInactiveClients, setDraftShowInactiveClients] = useState(false);
  const fromParam = searchParams.get("from");

  const rep = reps.find((entry) => entry.id === params.id)
    ?? MOCK_CLIENT_REPS.find((entry) => entry.id === params.id)
    ?? null;

  if (!rep) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-2xl font-bold text-foreground">Rep not found</p>
          <Link to="/all-clients" className="text-primary hover:underline text-sm font-medium">
            ← Back to All Clients
          </Link>
        </div>
      </AppLayout>
    );
  }

  const initials = ("initials" in rep && rep.initials) ? rep.initials : `${rep.firstName[0] ?? ""}${rep.lastName[0] ?? ""}`;
  const email = ("email" in rep && rep.email) ? rep.email : undefined;
  const avatarColor = getAvatarColor(initials);
  const backHref = fromParam ? `/${fromParam}` : "/all-clients";
  const backLabel = fromParam
    ? fromParam.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")
    : "All Clients";
  const clientRows: RepAccountRow[] = allClients
    .filter((client) => client.assignedRepId === rep.id)
    .map((client) => ({
      id: client.id,
      companyName: client.companyName,
      unitCount: client.unitCount,
      totalPlacements: client.totalPlacements ?? 0,
      status: client.status === "prospecting" ? "prospecting" : getClientStatus(client.lastPlacementDate ?? null),
      href: `/clients/${client.id}?from=rep/${rep.id}`,
    }));
  const visibleRows = [...clientRows]
    .filter((row) => showInactiveClients || row.status !== "inactive")
    .sort((a, b) => a.companyName.localeCompare(b.companyName));
  const hiddenInactiveCount = clientRows.filter((row) => row.status === "inactive").length;

  function openFilterModal() {
    setDraftShowInactiveClients(showInactiveClients);
    setShowFilterModal(true);
  }

  function applyFilters() {
    setShowInactiveClients(draftShowInactiveClients);
    setShowFilterModal(false);
  }

  return (
    <AppLayout>
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="sm:max-w-md rounded-3xl border-border p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-2xl font-display font-bold">Filter Accounts</DialogTitle>
            <DialogDescription>
              Choose whether inactive clients appear in this sales rep's account list.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6">
            <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/20 p-4 cursor-pointer">
              <Checkbox
                checked={draftShowInactiveClients}
                onCheckedChange={(checked) => setDraftShowInactiveClients(Boolean(checked))}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">Show inactive clients</p>
                <p className="text-sm text-muted-foreground">
                  Inactive clients are hidden by default and only appear when this filter is enabled.
                </p>
              </div>
            </label>
          </div>

          <DialogFooter className="border-t border-border bg-muted/10 px-6 py-4 sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setDraftShowInactiveClients(false);
                setShowInactiveClients(false);
                setShowFilterModal(false);
              }}
              className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Apply filter
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        {/* Back link */}
        <Link
          to={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {backLabel}
        </Link>

        {/* Profile card */}
        <div className="mb-4 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Banner */}
          <div className="h-36 bg-gradient-to-br from-sidebar to-primary/80 relative">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
            />
          </div>

          {/* Avatar overlapping banner */}
          <div className="px-8 pb-6">
            <div className="-mt-14 mb-4 flex gap-5">
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center text-2xl font-display font-bold border-4 border-background shadow-xl flex-shrink-0",
                avatarColor
              )}>
                  {initials}
              </div>
              <div className="pt-14">
                <h1 className="text-2xl font-display font-bold text-foreground leading-tight">
                  {rep.firstName} {rep.lastName}
                </h1>
                <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  {rep.title}
                </p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="bg-muted/30 rounded-xl p-4 border border-border/50 flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Email</p>
                  <a
                    href={email ? `mailto:${email}` : undefined}
                    className="text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors"
                  >
                    {email ?? "Not available"}
                  </a>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4 border border-border/50 flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Location</p>
                  <p className="text-sm font-medium text-foreground">{
                    "city" in rep && "state" in rep ? `${rep.city}, ${rep.state}` : "Unknown"
                  }</p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4 border border-border/50 flex items-start gap-3 sm:col-span-2">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Timezone</p>
                  <p className="text-sm font-medium text-foreground">{rep.timezone ?? "Unknown"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-border/50 bg-muted/20 px-6 py-4">
            <div>
              <h2 className="text-lg font-display font-bold text-foreground">Prospects And Clients</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Accounts assigned to {rep.firstName} {rep.lastName}.
                {!showInactiveClients && hiddenInactiveCount > 0 ? ` ${hiddenInactiveCount} inactive client${hiddenInactiveCount === 1 ? "" : "s"} hidden.` : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={openFilterModal}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          <div className="max-h-[65vh] overflow-x-auto overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground font-semibold border-b border-border/50">
                  <th className="sticky top-0 z-10 bg-muted/95 px-6 py-3.5 backdrop-blur supports-[backdrop-filter]:bg-muted/80">Company Name</th>
                  <th className="sticky top-0 z-10 bg-muted/95 px-6 py-3.5 text-right backdrop-blur supports-[backdrop-filter]:bg-muted/80">Unit Count</th>
                  <th className="sticky top-0 z-10 bg-muted/95 px-6 py-3.5 text-right backdrop-blur supports-[backdrop-filter]:bg-muted/80">Total Placements</th>
                  <th className="sticky top-0 z-10 bg-muted/95 px-6 py-3.5 backdrop-blur supports-[backdrop-filter]:bg-muted/80">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {visibleRows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        to={row.href}
                        className="text-sm font-semibold text-foreground transition-colors hover:text-primary hover:underline"
                      >
                        {row.companyName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-foreground">
                      {row.unitCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-foreground">
                      {row.totalPlacements.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize",
                        STATUS_STYLES[row.status],
                      )}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {visibleRows.length === 0 && (
              <div className="px-6 py-16 text-center text-sm text-muted-foreground">
                No prospects or clients match the current filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
