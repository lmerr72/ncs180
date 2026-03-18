import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import { Building2, Phone, MapPin, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfficeNode {
  id: string;
  name: string;
  type: "corporate" | "regional";
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  manager: string;
  units: number;
  properties: number;
  color: string;
  bg: string;
  dot: string;
}

const CORPORATE: OfficeNode = {
  id: "corp",
  name: "Synergy Properties",
  type: "corporate",
  address: "1200 Corporate Drive, Suite 800",
  city: "Denver",
  state: "CO",
  zip: "80202",
  phone: "(303) 555-0100",
  manager: "Margaret Holloway",
  units: 3200,
  properties: 18,
  color: "text-primary",
  bg: "bg-primary/10",
  dot: "bg-primary",
};

const REGIONAL_OFFICES: OfficeNode[] = [
  {
    id: "r1",
    name: "Northeast Region",
    type: "regional",
    address: "88 Boylston Street, Floor 12",
    city: "Boston",
    state: "MA",
    zip: "02116",
    phone: "(617) 555-0210",
    manager: "Patricia Delaney",
    units: 780,
    properties: 4,
    color: "text-violet-600",
    bg: "bg-violet-50",
    dot: "bg-violet-500",
  },
  {
    id: "r2",
    name: "Southeast Region",
    type: "regional",
    address: "3400 Peachtree Rd NE, Suite 300",
    city: "Atlanta",
    state: "GA",
    zip: "30326",
    phone: "(404) 555-0342",
    manager: "James Thornton",
    units: 640,
    properties: 3,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
  },
  {
    id: "r3",
    name: "Midwest Region",
    type: "regional",
    address: "233 S. Wacker Drive, Suite 5500",
    city: "Chicago",
    state: "IL",
    zip: "60606",
    phone: "(312) 555-0478",
    manager: "Linda Kaufmann",
    units: 920,
    properties: 5,
    color: "text-amber-600",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  {
    id: "r4",
    name: "West Region",
    type: "regional",
    address: "11100 Santa Monica Blvd, Ste 2000",
    city: "Los Angeles",
    state: "CA",
    zip: "90025",
    phone: "(310) 555-0589",
    manager: "Derek Montoya",
    units: 860,
    properties: 6,
    color: "text-sky-600",
    bg: "bg-sky-50",
    dot: "bg-sky-500",
  },
];

function CorporateCard({ office }: { office: OfficeNode }) {
  return (
    <div className="bg-card rounded-2xl border-2 border-primary/20 shadow-lg shadow-primary/5 p-6 w-full max-w-lg mx-auto relative">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/15">
              Corporate Office
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground">{office.name}</h3>
          <p className="text-sm text-muted-foreground">{office.manager}, Executive VP</p>
        </div>
      </div>

      {/* Divider */}
      <div className="my-4 border-t border-border/60" />

      {/* Details */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-start gap-2 col-span-2">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground leading-snug">
            <p>{office.address}</p>
            <p>{office.city}, {office.state} {office.zip}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground">{office.phone}</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground">{office.units.toLocaleString()} units total</p>
        </div>
      </div>

      {/* Footer stats */}
      <div className="mt-4 flex gap-4">
        <div className="flex-1 bg-primary/5 rounded-xl p-3 text-center border border-primary/10">
          <p className="text-lg font-bold text-primary">{office.properties}</p>
          <p className="text-[11px] text-muted-foreground">Properties</p>
        </div>
        <div className="flex-1 bg-primary/5 rounded-xl p-3 text-center border border-primary/10">
          <p className="text-lg font-bold text-primary">{office.units.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">Total Units</p>
        </div>
        <div className="flex-1 bg-primary/5 rounded-xl p-3 text-center border border-primary/10">
          <p className="text-lg font-bold text-primary">4</p>
          <p className="text-[11px] text-muted-foreground">Regions</p>
        </div>
      </div>
    </div>
  );
}

function RegionalCard({ office }: { office: OfficeNode }) {
  return (
    <div className={cn(
      "bg-card rounded-2xl border border-border shadow-sm p-4 w-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    )}>
      {/* Color bar */}
      <div className={cn("w-full h-1 rounded-full mb-4", office.dot)} />

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border", office.bg,
          office.color.replace("text-", "border-").replace("-600", "-200")
        )}>
          <Building2 className={cn("w-4.5 h-4.5", office.color)} />
        </div>
        <div className="min-w-0">
          <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-0.5", office.color)}>{office.name}</p>
          <p className="text-sm font-semibold text-foreground">{office.city}, {office.state}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-snug">{office.address}<br />{office.city}, {office.state} {office.zip}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground">{office.phone}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground">{office.manager}, Regional Director</p>
        </div>
      </div>

      {/* Footer stats */}
      <div className="mt-3 flex gap-2">
        <div className={cn("flex-1 rounded-lg p-2 text-center border", office.bg, office.color.replace("text-", "border-").replace("-600", "-100"))}>
          <p className={cn("text-sm font-bold", office.color)}>{office.properties}</p>
          <p className="text-[10px] text-muted-foreground">Prop.</p>
        </div>
        <div className={cn("flex-1 rounded-lg p-2 text-center border", office.bg, office.color.replace("text-", "border-").replace("-600", "-100"))}>
          <p className={cn("text-sm font-bold", office.color)}>{office.units}</p>
          <p className="text-[10px] text-muted-foreground">Units</p>
        </div>
      </div>
    </div>
  );
}

export default function ClientPortfolio() {
  return (
    <ClientPortalLayout>
      <div className="space-y-6">

        {/* ── Page title ───────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Corporate structure and regional office overview</p>
        </div>

        {/* ── Corporate Office Widget ──────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/10 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Corporate Office</h2>
          </div>

          <div className="px-6 py-5">
            <div className="flex flex-wrap items-center gap-8">
              {/* Icon + name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Organization</p>
                  <p className="text-xl font-bold text-foreground">{CORPORATE.name}</p>
                  <p className="text-sm text-muted-foreground">{CORPORATE.manager}, Executive VP</p>
                </div>
              </div>

              <div className="w-px h-14 bg-border hidden sm:block" />

              {/* Address */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted/50 border border-border flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Address</p>
                  <p className="text-sm font-medium text-foreground">{CORPORATE.address}</p>
                  <p className="text-sm text-muted-foreground">{CORPORATE.city}, {CORPORATE.state} {CORPORATE.zip}</p>
                </div>
              </div>

              <div className="w-px h-14 bg-border hidden sm:block" />

              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted/50 border border-border flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Phone</p>
                  <p className="text-sm font-medium text-foreground">{CORPORATE.phone}</p>
                  <p className="text-xs text-muted-foreground">Main line</p>
                </div>
              </div>

              <div className="w-px h-14 bg-border hidden sm:block" />

              {/* Quick stats */}
              <div className="flex gap-6">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Properties</p>
                  <p className="text-2xl font-bold text-foreground">{CORPORATE.properties}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Units</p>
                  <p className="text-2xl font-bold text-foreground">{CORPORATE.units.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Regions</p>
                  <p className="text-2xl font-bold text-foreground">4</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Organization Chart ───────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/10 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Organization Chart</h2>
          </div>

          <div className="px-6 py-8">
            {/* Corporate node */}
            <div className="flex justify-center">
              <CorporateCard office={CORPORATE} />
            </div>

            {/* Connector: vertical stem down from corporate */}
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-border" />
            </div>

            {/* Connector: horizontal bar + vertical drops */}
            <div className="relative">
              {/* Horizontal connecting bar — spans between first and last child centers */}
              {/* With 4 children in justify-between: first center ≈ 12.5%, last center ≈ 87.5% */}
              <div className="absolute top-0 left-[12.5%] right-[12.5%] h-0.5 bg-border" />

              {/* Children row */}
              <div className="flex justify-between gap-4 pt-0">
                {REGIONAL_OFFICES.map((office) => (
                  <div key={office.id} className="flex flex-col items-center flex-1">
                    {/* Vertical drop from horizontal bar to card */}
                    <div className="w-0.5 h-8 bg-border" />
                    <RegionalCard office={office} />
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-8 pt-6 border-t border-border/50 flex flex-wrap items-center gap-6 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Corporate Office</span>
              </div>
              {REGIONAL_OFFICES.map(r => (
                <div key={r.id} className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", r.dot)} />
                  <span className="text-xs text-muted-foreground">{r.city}, {r.state}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </ClientPortalLayout>
  );
}
