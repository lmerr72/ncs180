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

export const METRICS_YEARS = ["2022", "2023", "2024", "2025", "2026"];

export const SALES_METRICS_BY_YEAR: Record<string, {
  activeClients: number;
  inactiveClients: number;
  yearOverYearChange: number;
  averageRecoveryRate: string;
  averageRecoveryRateSubtext: string;
}> = {
  "2022": {
    activeClients: 104,
    inactiveClients: 19,
    yearOverYearChange: 16,
    averageRecoveryRate: "14.8%",
    averageRecoveryRateSubtext: "Mock recovery average for 2022",
  },
  "2023": {
    activeClients: 119,
    inactiveClients: 22,
    yearOverYearChange: 15,
    averageRecoveryRate: "26.2%",
    averageRecoveryRateSubtext: "Mock recovery average for 2023",
  },
  "2024": {
    activeClients: 138,
    inactiveClients: 24,
    yearOverYearChange: 19,
    averageRecoveryRate: "18.9%",
    averageRecoveryRateSubtext: "Mock recovery average for 2024",
  },
  "2025": {
    activeClients: 156,
    inactiveClients: 27,
    yearOverYearChange: 18,
    averageRecoveryRate: "21.3%",
    averageRecoveryRateSubtext: "Mock recovery average for 2025",
  },
  "2026": {
    activeClients: 163,
    inactiveClients: 29,
    yearOverYearChange: 7,
    averageRecoveryRate: "19.7%",
    averageRecoveryRateSubtext: "Mock recovery average for 2026",
  },
};

export const TAX_CAMPAIGN_PARTICIPATION = [
  { year: "2022", percentage: 18 },
  { year: "2023", percentage: 24 },
  { year: "2024", percentage: 31 },
  { year: "2025", percentage: 37 },
  { year: "2026", percentage: 29 },
];

export function getRepKey(stateName: string): RepKey {
  return STATE_TERRITORIES[stateName] ?? "open";
}
