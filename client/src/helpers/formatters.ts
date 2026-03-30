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