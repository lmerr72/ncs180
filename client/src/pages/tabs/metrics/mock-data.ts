import { type RepKey, STATE_TERRITORIES } from "@/lib/mock-data";

export interface RepInfo {
  name: string;
  color: string;
  textColor: string;
  label: string;
}

export const REPS: Record<RepKey, RepInfo> = {
    gordon:  { name: "Gordon Marshall", color: "#3B82F6", textColor: "#fff", label: "Gordon Marshall" },
    tina:    { name: "Tina Smith",      color: "#8B5CF6", textColor: "#fff", label: "Tina Smith"      },
    pete:    { name: "Pete Mitchell",   color: "#F97316", textColor: "#fff", label: "Pete Mitchell"   },
    heath:   { name: "Heath Lindsey",   color: "#10B981", textColor: "#fff", label: "Heath Lindsey"   },
    rod:     { name: "Rod Stewart",     color: "#EF4444", textColor: "#fff", label: "Rod Stewart"     },
    michael: { name: "Michael Scott",   color: "#F59E0B", textColor: "#fff", label: "Michael Scott"   },
    kim:     { name: "Kim Wexler",      color: "#EC4899", textColor: "#fff", label: "Kim Wexler"      },
    kristen: { name: "Kristen Bell",    color: "#06B6D4", textColor: "#fff", label: "Kristen Bell"    },
    gxavier: { name: "Gordon Xavier",   color: "#6366F1", textColor: "#fff", label: "Gordon Xavier"   },
    open:    { name: "Open Territory",  color: "#CBD5E1", textColor: "#475569", label: "Open"         },
  };

  export const ACTIVE_CLIENTS_HISTORY = [
    { year: "2016", clients: 45 }, { year: "2017", clients: 58 },
    { year: "2018", clients: 67 }, { year: "2019", clients: 82 },
    { year: "2020", clients: 71 }, { year: "2021", clients: 88 },
    { year: "2022", clients: 104 }, { year: "2023", clients: 119 },
    { year: "2024", clients: 138 }, { year: "2025", clients: 156 },
    { year: "2026", clients: 163 },
  ];
  
  export const TOTAL_INACTIVE = 27;

export function getRepKey(stateName: string): RepKey {
  return STATE_TERRITORIES[stateName] ?? "open";
}
