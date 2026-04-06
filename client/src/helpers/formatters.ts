import { differenceInCalendarDays } from "date-fns";

export function daysFromToday(date: string | null | undefined) {
if (!date) return 0;
  return differenceInCalendarDays(new Date(date), new Date());
}

export function getInitials(first:String,last:String){
  if (!last) {
    if (!first) {
      return ''
    }
    return `${first[0]}`
  }
    return `${first[0]}${last[0]}`
}
export function formatLabel(s:string){
    return s
    .replace(/_/g, " ")                 // replace underscores with spaces
    .toLowerCase()                     // normalize casing
    .replace(/\b\w/g, char => char.toUpperCase()); // capitalize each word
}


export function dateIsXDaysAgo(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return d < oneYearAgo;
  }

  export function formatMonthYear(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  
  export function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    const months = Math.floor(days / 30);
    if (days > 60) return `${months}m ago`;
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    return `${mins}m ago`;
  }
  
  export function formatApolloContactName(contact: { firstName: string; lastName: string }) {
    return `${contact.firstName} ${contact.lastName}`.trim() || contact.firstName || "Unnamed contact";
  }
  
  export function formatCompactNumber(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: value >= 1000 ? 1 : 0,
    }).format(value);
  }
  
  export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: value >= 1000000 ? "compact" : "standard",
      maximumFractionDigits: value >= 1000000 ? 1 : 0,
    }).format(value);
  }