import type { Client } from "@/types/api";

export type PlacementMonth = {
  monthDate: Date;
  placements: number;
};

export type ReportingRow = {
  id: string;
  debtorName: string;
  accountNumber: string;
  apartmentNumber: string;
  datePlaced: string;
  datePlacedValue: Date;
  iqs: number;
  placedAmount: number;
  collectedAmount: number;
  balanceAmount: number;
};

const DEBTOR_FIRST_NAMES = ["James", "Ava", "Michael", "Sophia", "Daniel", "Olivia", "Elijah", "Mia"];
const DEBTOR_LAST_NAMES = ["Carter", "Nguyen", "Mitchell", "Reed", "Patel", "Brooks", "Foster", "Rivera"];

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function getClientSeed(client: Client): number {
  return Array.from(client.id || client.companyName).reduce((total, char) => total + char.charCodeAt(0), 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPlacedDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

export function buildPlacementMonths(client: Client, selectedYear: string): PlacementMonth[] {
  const year = Number(selectedYear);
  const periodEnd = new Date(year, 11, 1);
  const unitCount = Math.max(client.unitCount ?? 0, 0);
  const seed = getClientSeed(client);

  return Array.from({ length: 15 }, (_, index) => {
    const monthDate = addMonths(periodEnd, index - 14);
    const percent = 5 + ((seed + index * 37 + monthDate.getMonth() * 11 + monthDate.getFullYear()) % 26);
    const placements = Math.round(unitCount * (percent / 100));

    return { monthDate, placements };
  });
}

export function calculatePlacementChange(months: PlacementMonth[]): number {
  const currentWindow = months.slice(-3);
  const priorWindow = months.slice(-6, -3);
  const currentTotal = currentWindow.reduce((total, month) => total + month.placements, 0);
  const priorTotal = priorWindow.reduce((total, month) => total + month.placements, 0);

  if (priorTotal === 0) return currentTotal > 0 ? 100 : 0;

  return Math.round(((currentTotal - priorTotal) / priorTotal) * 100);
}

export function buildReportingRows(client: Client): ReportingRow[] {
  const seed = getClientSeed(client);

  return Array.from({ length: 6 }, (_, index) => {
    const firstName = DEBTOR_FIRST_NAMES[(seed + index) % DEBTOR_FIRST_NAMES.length];
    const lastName = DEBTOR_LAST_NAMES[(seed + index * 3) % DEBTOR_LAST_NAMES.length];
    const placedAmount = 900 + ((seed + index * 173) % 3200);
    const collectedAmount = Math.round(placedAmount * (0.18 + (((seed + index * 41) % 37) / 100)));
    const balanceAmount = placedAmount - collectedAmount;
    const placementMonth = (seed + index * 2) % 12;
    const placementDay = 1 + ((seed + index * 7) % 27);
    const placementYear = 2025 + ((seed + index) % 2);
    const datePlacedValue = new Date(placementYear, placementMonth, placementDay);
    const iqs = (seed + index * 17) % 101;

    return {
      id: `${client.id || client.companyName}-reporting-${index}`,
      debtorName: `${firstName} ${lastName}`,
      accountNumber: `${710000 + ((seed * 13 + index * 97) % 900000)}`,
      apartmentNumber: `${100 + ((seed + index * 11) % 900)}`,
      datePlaced: formatPlacedDate(datePlacedValue),
      datePlacedValue,
      iqs,
      placedAmount,
      collectedAmount,
      balanceAmount,
    };
  });
}
