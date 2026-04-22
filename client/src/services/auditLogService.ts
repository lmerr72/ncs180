import { gql } from "@apollo/client";
import { apolloClient } from "@/lib/apollo";
import type { AuditEntry } from "@/types/api";
import { AUTH_STORAGE_KEY } from "@/context/AuthContext";

type GraphqlAuditEntry = {
  id: string;
  clientId: string;
  action: string;
  author: string;
  repId: string;
  timestamp: string;
  type: AuditEntry["type"];
};

type AuditLogEntriesQueryData = {
  auditLogEntries: GraphqlAuditEntry[];
};

type AuditLogEntriesQueryVariables = {
  clientId: string;
  startDate?: string;
  endDate?: string;
};

type CreateAuditLogEntryMutationData = {
  createAuditLogEntry: GraphqlAuditEntry;
};

type CreateAuditLogEntryMutationVariables = {
  input: {
    clientId: string;
    action: string;
    author?: string;
    repId?: string;
    timestamp?: string;
    type: AuditEntry["type"];
  };
};

export const AUDIT_LOG_ENTRY_FIELDS = gql`
  fragment AuditLogEntryFields on AuditLogEntry {
    id
    clientId
    action
    author
    repId
    timestamp
    type
  }
`;

export const AUDIT_LOG_ENTRIES_QUERY = gql`
  query AuditLogEntries($clientId: ID!, $startDate: String, $endDate: String) {
    auditLogEntries(clientId: $clientId, startDate: $startDate, endDate: $endDate) {
      ...AuditLogEntryFields
    }
  }
  ${AUDIT_LOG_ENTRY_FIELDS}
`;

export const CREATE_AUDIT_LOG_ENTRY_MUTATION = gql`
  mutation CreateAuditLogEntry($input: CreateAuditLogEntryInput!) {
    createAuditLogEntry(input: $input) {
      ...AuditLogEntryFields
    }
  }
  ${AUDIT_LOG_ENTRY_FIELDS}
`;

function normalizeAuditEntry(entry: GraphqlAuditEntry): AuditEntry {
  return {
    id: entry.id,
    clientId: entry.clientId,
    action: entry.action,
    author: entry.author,
    repId: entry.repId,
    timestamp: entry.timestamp,
    type: entry.type
  };
}

type StoredAuditUser = {
  firstName?: string | null;
  lastName?: string | null;
  repId?: string | null;
};

function getLoggedInAuditUser(): StoredAuditUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as StoredAuditUser | null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getAuditLogEntries(
  clientId: string,
  startDate?: string,
  endDate?: string
): Promise<AuditEntry[]> {
  if (!clientId) return [];

  const response = await apolloClient.query<AuditLogEntriesQueryData, AuditLogEntriesQueryVariables>({
    query: AUDIT_LOG_ENTRIES_QUERY,
    variables: {
      clientId,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {})
    },
    fetchPolicy: "network-only"
  });

  return response.data.auditLogEntries.map(normalizeAuditEntry);
}

export async function createAuditLogEntry(
  input: CreateAuditLogEntryMutationVariables["input"]
): Promise<AuditEntry> {
  const loggedInUser = getLoggedInAuditUser();
  const repId = loggedInUser?.repId?.trim() || input.repId || "";
  const authorName = [loggedInUser?.firstName?.trim(), loggedInUser?.lastName?.trim()]
    .filter(Boolean)
    .join(" ");
  const author = authorName || input.author || "System";

  const response = await apolloClient.mutate<
    CreateAuditLogEntryMutationData,
    CreateAuditLogEntryMutationVariables
  >({
    mutation: CREATE_AUDIT_LOG_ENTRY_MUTATION,
    variables: {
      input: {
        ...input,
        author,
        repId
      }
    }
  });

  if (!response.data?.createAuditLogEntry) {
    throw new Error("Audit log creation did not return a record.");
  }

  return normalizeAuditEntry(response.data.createAuditLogEntry);
}
