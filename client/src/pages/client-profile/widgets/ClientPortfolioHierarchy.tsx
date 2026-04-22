import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Home, MapPin, Phone, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyNode {
  id: string;
  clientId: string;
  name: string;
  city: string;
  state: string;
  units: number;
  manager: string;
  assignedRep: string;
}

interface RegionalNode {
  id: string;
  clientId: string;
  name: string;
  city: string;
  state: string;
  phone: string;
  director: string;
  assignedRep: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
  properties: PropertyNode[];
}

interface HeadquartersNode {
  clientId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  director: string;
  assignedRep: string;
}

const HEADQUARTERS: HeadquartersNode = {
  clientId: "mock-hq-synergy",
  name: "Synergy Properties Headquarters",
  address: "1200 Corporate Drive, Suite 800",
  city: "Denver",
  state: "CO",
  zip: "80202",
  phone: "(303) 555-0100",
  director: "Margaret Holloway",
  assignedRep: "Gordon Marshall",
};

const REGIONALS: RegionalNode[] = [
  {
    id: "mountain",
    clientId: "mock-regional-mountain",
    name: "Mountain Regional",
    city: "Denver",
    state: "CO",
    phone: "(303) 555-0144",
    director: "Avery Monroe",
    assignedRep: "Jennifer Walsh",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    dot: "bg-sky-500",
    properties: [
      { id: "aspen", clientId: "mock-property-aspen-ridge", name: "Aspen Ridge", city: "Aurora", state: "CO", units: 212, manager: "Nora Singh", assignedRep: "Jennifer Walsh" },
      { id: "canyon", clientId: "mock-property-canyon-flats", name: "Canyon Flats", city: "Boulder", state: "CO", units: 168, manager: "Mateo Cruz", assignedRep: "Gordon Marshall" },
      { id: "summit", clientId: "mock-property-summit-park", name: "Summit Park", city: "Fort Collins", state: "CO", units: 194, manager: "Elaine Brooks", assignedRep: "Jennifer Walsh" },
    ],
  },
  {
    id: "southwest",
    clientId: "mock-regional-southwest",
    name: "Southwest Regional",
    city: "Phoenix",
    state: "AZ",
    phone: "(602) 555-0198",
    director: "Julian Reed",
    assignedRep: "Monica Lee",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    properties: [
      { id: "mesa", clientId: "mock-property-mesa-landing", name: "Mesa Landing", city: "Mesa", state: "AZ", units: 156, manager: "Priya Desai", assignedRep: "Monica Lee" },
      { id: "saguaro", clientId: "mock-property-saguaro-commons", name: "Saguaro Commons", city: "Tempe", state: "AZ", units: 221, manager: "Calvin Tate", assignedRep: "Gordon Marshall" },
      { id: "redrock", clientId: "mock-property-red-rock-village", name: "Red Rock Village", city: "Scottsdale", state: "AZ", units: 137, manager: "Maya Fields", assignedRep: "Monica Lee" },
    ],
  },
  {
    id: "southeast",
    clientId: "mock-regional-southeast",
    name: "Southeast Regional",
    city: "Atlanta",
    state: "GA",
    phone: "(404) 555-0172",
    director: "Camille Watson",
    assignedRep: "Elliot Parker",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    properties: [
      { id: "peachtree", clientId: "mock-property-peachtree-station", name: "Peachtree Station", city: "Atlanta", state: "GA", units: 184, manager: "Jordan Ellis", assignedRep: "Elliot Parker" },
      { id: "magnolia", clientId: "mock-property-magnolia-grove", name: "Magnolia Grove", city: "Savannah", state: "GA", units: 149, manager: "Tessa Grant", assignedRep: "Jennifer Walsh" },
      { id: "riverbend", clientId: "mock-property-riverbend-crossing", name: "Riverbend Crossing", city: "Charlotte", state: "NC", units: 206, manager: "Owen Keller", assignedRep: "Elliot Parker" },
    ],
  },
];

const totalProperties = REGIONALS.reduce((sum, regional) => sum + regional.properties.length, 0);
const totalUnits = REGIONALS.reduce(
  (sum, regional) => sum + regional.properties.reduce((regionalSum, property) => regionalSum + property.units, 0),
  0
);

const portfolioRows = [
  {
    id: "headquarters",
    clientId: HEADQUARTERS.clientId,
    companyName: HEADQUARTERS.name,
    location: `${HEADQUARTERS.city}, ${HEADQUARTERS.state}`,
    unitCount: totalUnits,
    assignedRep: HEADQUARTERS.assignedRep,
  },
  ...REGIONALS.flatMap((regional) => {
    const regionalUnits = regional.properties.reduce((sum, property) => sum + property.units, 0);

    return [
      {
        id: regional.id,
        clientId: regional.clientId,
        companyName: regional.name,
        location: `${regional.city}, ${regional.state}`,
        unitCount: regionalUnits,
        assignedRep: regional.assignedRep,
      },
      ...regional.properties.map((property) => ({
        id: property.id,
        clientId: property.clientId,
        companyName: property.name,
        location: `${property.city}, ${property.state}`,
        unitCount: property.units,
        assignedRep: property.assignedRep,
      })),
    ];
  }),
];

function HeadquartersCard() {
  return (
    <Link
      to={`/clients/${HEADQUARTERS.clientId}`}
      className="block bg-card rounded-2xl border-2 border-primary/20 shadow-sm p-5 transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/15"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-wider">Headquarters</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{HEADQUARTERS.name}</h3>
            <p className="text-sm text-muted-foreground">{HEADQUARTERS.director}, Portfolio Director</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[520px]">
          <div className="rounded-xl border border-border bg-muted/10 p-3">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Office</p>
            <p className="mt-1 text-sm font-medium text-foreground">{HEADQUARTERS.address}</p>
            <p className="text-xs text-muted-foreground">{HEADQUARTERS.city}, {HEADQUARTERS.state} {HEADQUARTERS.zip}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/10 p-3">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Phone</p>
            <p className="mt-1 text-sm font-medium text-foreground">{HEADQUARTERS.phone}</p>
            <p className="text-xs text-muted-foreground">Main line</p>
          </div>
          <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Portfolio</p>
            <p className="mt-1 text-sm font-medium text-foreground">{totalProperties} properties</p>
            <p className="text-xs text-muted-foreground">{totalUnits.toLocaleString()} units</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PropertyCard({ property }: { property: PropertyNode }) {
  return (
    <Link
      to={`/clients/${property.clientId}`}
      className="block rounded-xl border border-border bg-background p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/15"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-muted/50 border border-border flex items-center justify-center flex-shrink-0">
          <Home className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{property.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {property.city}, {property.state}
            </span>
            <span>{property.units.toLocaleString()} units</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{property.manager}, Property Manager</p>
        </div>
      </div>
    </Link>
  );
}

function RegionalColumn({ regional }: { regional: RegionalNode }) {
  const regionalUnits = regional.properties.reduce((sum, property) => sum + property.units, 0);

  return (
    <div className="flex min-w-0 flex-col">
      <div className="mx-auto h-8 w-0.5 bg-border" />
      <div className={cn("rounded-2xl border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md", regional.border)}>
        <div className={cn("h-1.5", regional.dot)} />
        <Link
          to={`/clients/${regional.clientId}`}
          className={cn("block p-4 border-b transition-colors hover:bg-opacity-80 focus:outline-none focus:ring-4 focus:ring-primary/15", regional.bg, regional.border)}
        >
          <div className="flex items-start gap-3">
            <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 bg-card", regional.border)}>
              <Building2 className={cn("w-5 h-5", regional.color)} />
            </div>
            <div className="min-w-0">
              <p className={cn("text-xs font-bold uppercase tracking-wider", regional.color)}>{regional.name}</p>
              <p className="text-sm font-semibold text-foreground">{regional.city}, {regional.state}</p>
              <p className="mt-1 text-xs text-muted-foreground">{regional.director}, Regional Director</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border/70 bg-card/70 p-2 text-center">
              <p className={cn("text-base font-bold", regional.color)}>{regional.properties.length}</p>
              <p className="text-[10px] text-muted-foreground">Properties</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/70 p-2 text-center">
              <p className={cn("text-base font-bold", regional.color)}>{regionalUnits.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Units</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/70 p-2 text-center">
              <Phone className={cn("mx-auto h-4 w-4", regional.color)} />
              <p className="mt-0.5 text-[10px] text-muted-foreground">{regional.phone}</p>
            </div>
          </div>
        </Link>

        <div className="space-y-3 p-3">
          {regional.properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ClientPortfolioHierarchy() {
  const [view, setView] = useState<"hierarchy" | "table">("hierarchy");

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 bg-muted/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Portfolio Hierarchy</h2>
          </div>

          <div className="inline-flex w-full rounded-lg border border-border bg-card p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setView("hierarchy")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none",
                view === "hierarchy" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Hierarchy
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none",
                view === "table" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Table
            </button>
          </div>
        </div>

        {view === "hierarchy" ? (
          <div className="p-4 sm:p-6">
            <HeadquartersCard />

            <div className="flex justify-center">
              <div className="h-8 w-0.5 bg-border" />
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute left-[16.66%] right-[16.66%] top-0 h-0.5 bg-border" />
              <div className="grid grid-cols-3 gap-5">
                {REGIONALS.map((regional) => (
                  <RegionalColumn key={regional.id} regional={regional} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {REGIONALS.map((regional) => (
                <RegionalColumn key={regional.id} regional={regional} />
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border/60 bg-muted/20 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 text-left">Company Name</th>
                  <th className="px-6 py-3 text-left">Location</th>
                  <th className="px-6 py-3 text-right">Unit Count</th>
                  <th className="px-6 py-3 text-left">Assigned Rep</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {portfolioRows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-primary/5">
                    <td className="px-6 py-4">
                      <Link to={`/clients/${row.clientId}`} className="font-semibold text-foreground hover:text-primary hover:underline">
                        {row.companyName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{row.location}</td>
                    <td className="px-6 py-4 text-right font-medium text-foreground">{row.unitCount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-muted-foreground">{row.assignedRep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
