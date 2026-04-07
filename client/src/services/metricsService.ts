import { gql } from "@apollo/client";
import { apolloClient } from "@/lib/apollo";
import { createBrowserLogger } from "@/lib/logger";

type GraphqlClientStatus = "ACTIVE" | "INACTIVE" | "PROSPECTING" | "ONBOARDING" | null;

type GraphqlMetricsClient = {
  id: string;
  createdDate: string;
  createdClientDate?: string | null;
  activeClientDate?: string | null;
  archiveDate?: string | null;
  clientStatus?: GraphqlClientStatus;
  mostRecentFilePlacementDate?: string | null;
};

type MetricsQueryData = {
  allClients: GraphqlMetricsClient[];
  myClients: GraphqlMetricsClient[];
};

export type ActiveClientsHistoryPoint = {
  year: string;
  clients: number;
};

export type SalesMetrics = {
  activeClients: number;
  inactiveClients: number;
  activeClientsHistory: ActiveClientsHistoryPoint[];
  yearOverYearChange: number;
  averageRecoveryRate: string;
  averageRecoveryRateSubtext: string;
};

const logger = createBrowserLogger("metrics-service");

export const SALES_METRICS_QUERY = gql`
  query SalesMetrics {
    allClients {
      id
      createdDate
      createdClientDate
      activeClientDate
      archiveDate
      clientStatus
      mostRecentFilePlacementDate
    }
    myClients {
      id
      createdDate
      createdClientDate
      activeClientDate
      archiveDate
      clientStatus
      mostRecentFilePlacementDate
    }
  }
`;

let metricsRequest: Promise<SalesMetrics> | null = null;

export async function getSalesMetrics(): Promise<SalesMetrics> {
  if (!metricsRequest) {
    metricsRequest = fetchSalesMetrics().finally(() => {
      metricsRequest = null;
    });
  }

  return metricsRequest;
}

async function fetchSalesMetrics(): Promise<SalesMetrics> {
  const response = await apolloClient.query<MetricsQueryData>({
    query: SALES_METRICS_QUERY,
    fetchPolicy: "network-only"
  });

  return buildSalesMetrics(response.data.allClients, response.data.myClients);
}

function buildSalesMetrics(allClients: GraphqlMetricsClient[], myClients: GraphqlMetricsClient[]): SalesMetrics {
  const activeClientsHistory = buildActiveClientsHistory(allClients);
  const activeClients = activeClientsHistory[activeClientsHistory.length - 1]?.clients ?? 0;
  const previousYearClients = activeClientsHistory[activeClientsHistory.length - 2]?.clients ?? activeClients;

  return {
    activeClients,
    inactiveClients: countInactiveClients(allClients),
    activeClientsHistory,
    yearOverYearChange: activeClients - previousYearClients,
    averageRecoveryRate: "—",
    averageRecoveryRateSubtext: myClients.length > 0
      ? "Recovery-rate data is not available in GraphQL yet"
      : "No assigned clients available"
  };
}

function buildActiveClientsHistory(clients: GraphqlMetricsClient[]): ActiveClientsHistoryPoint[] {
  const currentYear = new Date().getFullYear();
  const firstYear = clients.reduce<number>((earliest, client) => {
    const startDate = getClientStartDate(client);
    if (!startDate) {
      return earliest;
    }

    return Math.min(earliest, startDate.getFullYear());
  }, currentYear);

  const startYear = Math.min(firstYear, currentYear);
  const history: ActiveClientsHistoryPoint[] = [];

  for (let year = startYear; year <= currentYear; year += 1) {
    const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    const clientsAtYearEnd = clients.filter((client) => isClientActiveAtDate(client, yearEnd)).length;
    history.push({ year: String(year), clients: clientsAtYearEnd });
  }

  return history;
}

function countInactiveClients(clients: GraphqlMetricsClient[]): number {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  return clients.filter((client) => {
    if (client.clientStatus === "PROSPECTING" || client.clientStatus === "ONBOARDING") {
      return false;
    }

    const lastPlacementDate = parseDate(client.mostRecentFilePlacementDate);
    return !lastPlacementDate || lastPlacementDate < cutoff;
  }).length;
}

function isClientActiveAtDate(client: GraphqlMetricsClient, date: Date): boolean {
  const startDate = getClientStartDate(client);
  if (!startDate || startDate > date) {
    return false;
  }

  const archiveDate = parseDate(client.archiveDate);
  return !archiveDate || archiveDate > date;
}

function getClientStartDate(client: GraphqlMetricsClient): Date | null {
  return (
    parseDate(client.activeClientDate) ??
    parseDate(client.createdClientDate) ??
    (client.clientStatus === "ACTIVE" || client.clientStatus === "INACTIVE" ? parseDate(client.createdDate) : null)
  );
}

function parseDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    logger.warn("Ignoring invalid metrics date", { value });
    return null;
  }

  return parsed;
}
