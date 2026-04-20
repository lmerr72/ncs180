import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "@vnedyalk0v/react19-simple-maps";
import { CalendarDays, Check, MapPin } from "lucide-react";
import { getRepKey, REPS, type RepInfo } from "./mock-data";
import { type RepKey } from "@/lib/mock-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function darken(hex: string): string {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((n >> 16) & 0xff) - 30);
    const g = Math.max(0, ((n >> 8) & 0xff) - 30);
    const b = Math.max(0, (n & 0xff) - 30);
    return `rgb(${r},${g},${b})`;
  }

interface TooltipState { stateName: string; repKey: RepKey; x: number; y: number }

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

type TerritoryMapProps = {
    selectedYear: string;
    onYearChange: (year: string) => void;
    years: string[];
};

export function TerritoryMap({ selectedYear, onYearChange, years }: TerritoryMapProps) {
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const [hoveredState, setHoveredState] = useState<string | null>(null);
  
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Sales Territory Map</h2>
            <span className="text-xs text-muted-foreground ml-1">— {selectedYear} territories</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label="Change territory map year"
              >
                <CalendarDays className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {years.map((year) => (
                <DropdownMenuItem
                  key={year}
                  onSelect={() => onYearChange(year)}
                  className="justify-between"
                >
                  {year}
                  {year === selectedYear && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
  
        <div className="p-4 relative">
          {/* Map */}
          <div className="relative select-none" style={{ touchAction: "none" }}>
            <ComposableMap
              projection="geoAlbersUsa"
              width={800}
              height={480}
              style={{ width: "100%", height: "auto" }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const stateName: string = geo.properties.name;
                    const repKey = getRepKey(stateName);
                    const rep = REPS[repKey];
                    const isHovered = hoveredState === stateName;
  
                    return (
                      <Geography
                        key={String(geo.id ?? stateName)}
                        geography={geo}
                        fill={isHovered ? darken(rep.color) : rep.color}
                        stroke="#ffffff"
                        strokeWidth={0.8}
                        style={{
                          default: { outline: "none", transition: "fill 120ms ease" },
                          hover:   { outline: "none", cursor: "pointer" },
                          pressed: { outline: "none" },
                        }}
                        onMouseEnter={(e) => {
                          setHoveredState(stateName);
                          setTooltip({ stateName, repKey, x: e.clientX, y: e.clientY });
                        }}
                        onMouseMove={(e) => {
                          setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                        }}
                        onMouseLeave={() => {
                          setHoveredState(null);
                          setTooltip(null);
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>
  
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {(Object.entries(REPS) as [RepKey, RepInfo][]).map(([key, rep]) => (
              <div key={key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-muted/20 text-xs font-medium">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: rep.color }} />
                <span className="text-foreground">{rep.label}</span>
              </div>
            ))}
          </div>
        </div>
  
        {/* Tooltip — rendered as fixed overlay */}
        {tooltip && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
          >
            <div className="bg-popover border border-border rounded-xl shadow-xl px-3.5 py-2.5 min-w-[160px]">
              <p className="text-sm font-bold text-foreground mb-0.5">{tooltip.stateName}</p>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: REPS[tooltip.repKey].color }}
                />
                <p className="text-xs text-muted-foreground">{REPS[tooltip.repKey].name}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
