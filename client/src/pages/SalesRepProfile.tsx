import { useQuery } from "@apollo/client/react";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { MapPin, Clock, Mail, ArrowLeft, ShieldCheck, Filter } from "lucide-react";
import { cn, getAvatarColor } from "@/lib/utils";
import { REP_CLIENTS_QUERY, type GraphqlClient, normalizeClient } from "@/services/clientService";
import { SALES_REP_PROFILE_QUERY, type SalesRepProfileQueryData } from "@/services/salesRepProfileService";
import { ModalContainer } from "@/components/shared/ModalContainer";

type RepAccountRow = {
  id: string;
  companyName: string;
  unitCount: number;
  totalPlacements: number;
  status: "prospecting" | "active" | "inactive" | "onboarding";
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
  onboarding: "bg-violet-100 text-violet-700 border-violet-200"
};

type RepClientsQueryData = {
  repClients: GraphqlClient[];
};

type RepClientsQueryVariables = {
  assignedRepId: string;
};

export default function SalesRepProfile() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showInactiveClients, setShowInactiveClients] = useState(false);
  const [draftShowInactiveClients, setDraftShowInactiveClients] = useState(false);
  const fromParam = searchParams.get("from");
  const { data, loading, error } = useQuery<SalesRepProfileQueryData>(SALES_REP_PROFILE_QUERY, {
    skip: !params.id,
  });
  const rep = data?.users.find((entry) => entry.id === params.id) ?? null;
  const {
    data: repClientsData,
    loading: repClientsLoading,
    error: repClientsError,
  } = useQuery<RepClientsQueryData, RepClientsQueryVariables>(REP_CLIENTS_QUERY, {
    variables: params.id ? { assignedRepId: params.id } : undefined,
    skip: !params.id || !rep,
  });
  const repClients = repClientsData?.repClients.map(normalizeClient) ?? [];

  if (loading || (rep && repClientsLoading)) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-2xl font-bold text-foreground">Loading rep profile...</p>
          <Link to="/clients" className="text-primary hover:underline text-sm font-medium">
            ← Back to Clients
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-2xl font-bold text-foreground">Unable to load rep profile</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Link to="/clients" className="text-primary hover:underline text-sm font-medium">
            ← Back to Clients
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (repClientsError) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-2xl font-bold text-foreground">Unable to load rep profile</p>
          <p className="text-sm text-muted-foreground">{repClientsError.message}</p>
          <Link to="/clients" className="text-primary hover:underline text-sm font-medium">
            ← Back to Clients
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (!rep) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-2xl font-bold text-foreground">Rep not found</p>
          <Link to="/clients" className="text-primary hover:underline text-sm font-medium">
            ← Back to Clients
          </Link>
        </div>
      </AppLayout>
    );
  }

  const initials = ("initials" in rep && rep.initials) ? rep.initials : `${rep.firstName[0] ?? ""}${rep.lastName[0] ?? ""}`;
  const email = ("email" in rep && rep.email) ? rep.email : undefined;
  const avatarColor = getAvatarColor(initials);
  const backHref = fromParam ? `/${fromParam}` : "/clients";
  const backLabel = fromParam
    ? fromParam.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")
    : "Clients";
  const clientRows: RepAccountRow[] = repClients
    .map((client) => ({
      id: client.id,
      companyName: client.companyName,
      unitCount: client.unitCount,
      totalPlacements: client.totalPlacements ?? 0,
      status: client.clientStatus === "prospecting" ? "prospecting" : getClientStatus(client.mostRecentFilePlacementDate ?? null),
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
        <DialogContent className="sm:max-w-md border-none bg-transparent p-0 shadow-none [&>button]:hidden">
          <ModalContainer
            title="Filter Accounts"
            description="Choose whether inactive clients appear in this sales rep's account list."
            onClose={() => setShowFilterModal(false)}
            primaryAction={{ label: "Apply filter", onClick: applyFilters }}
            secondaryAction={{
              label: "Reset",
              onClick: () => {
                setDraftShowInactiveClients(false);
                setShowInactiveClients(false);
                setShowFilterModal(false);
              },
            }}
            titleClassName="text-2xl"
            bodyClassName="pt-0"
          >
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
          </ModalContainer>
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
          <div className="relative h-56 bg-gradient-to-br from-sidebar to-primary/80">
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
            />

            <div className="absolute inset-x-0 bottom-0 px-8 pb-6">
              <div className="flex items-end gap-5">
                <div className={cn(
                  "w-32 h-32 rounded-full flex items-center justify-center text-3xl font-display font-bold border-4 border-background shadow-xl flex-shrink-0",
                  avatarColor
                )}>
                  {initials}
                </div>
                <div className="pb-4 text-white drop-shadow-md">
                  <h1 className="text-2xl font-display font-bold leading-tight">
                    {rep.firstName} {rep.lastName}
                  </h1>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/85">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    {rep.title}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Avatar overlapping banner */}
          <div className="px-8 pb-6 pt-6">
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
              <h2 className="text-lg font-display font-bold text-foreground">Prospects and Clients</h2>
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
