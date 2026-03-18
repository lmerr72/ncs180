import { Link, useParams, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { REP_DETAILS } from "@/lib/mock-data";
import { MapPin, Clock, Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import { cn, getAvatarColor } from "@/lib/utils";

export default function SalesRepProfile() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("from");

  const rep = REP_DETAILS[params.id];

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

  const avatarColor = getAvatarColor(rep.initials);
  const backHref = fromParam ? `/${fromParam}` : "/all-clients";
  const backLabel = fromParam
    ? fromParam.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")
    : "All Clients";

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto pb-12 space-y-6">
        {/* Back link */}
        <Link
          to={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {backLabel}
        </Link>

        {/* Profile card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Banner */}
          <div className="h-36 bg-gradient-to-br from-sidebar to-primary/80 relative">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
            />
          </div>

          {/* Avatar overlapping banner */}
          <div className="px-8 pb-6">
            <div className="-mt-14 mb-4 flex items-end gap-5">
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center text-2xl font-display font-bold border-4 border-background shadow-xl flex-shrink-0",
                avatarColor
              )}>
                {rep.initials}
              </div>
              <div className="pb-1">
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
                    href={`mailto:${rep.email}`}
                    className="text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors"
                  >
                    {rep.email}
                  </a>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4 border border-border/50 flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Location</p>
                  <p className="text-sm font-medium text-foreground">{rep.location}</p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4 border border-border/50 flex items-start gap-3 sm:col-span-2">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Timezone</p>
                  <p className="text-sm font-medium text-foreground">{rep.timezone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
