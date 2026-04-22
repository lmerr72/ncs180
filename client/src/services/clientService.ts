import { gql } from "@apollo/client";
import { apolloClient } from "@/lib/apollo";
import type { Client, ClientIntegration, ClientMetadata, OnboardingChecklist, UserProfile } from "@/types/api";
import { createAuditLogEntry } from "@/services/auditLogService";
import { AuthProvider } from "@/context/AuthContext";

export type GraphqlClientStatus = "ACTIVE" | "INACTIVE" | "PROSPECTING" | null;
export type GraphqlProspectStatus =
  | "VERBAL"
  | "NOT_STARTED"
  | "IN_COMMUNICATION"
  | "AWAITING_REVIEW"
  | "ONBOARDING"
  | "CLOSED"
  | null;
export type GraphqlClientIntegration = ClientIntegration | null;

export type GraphqlClient = {
  id: string;
  clientId: string | null;
  companyName: string;
  assignedRepId: string | null;
  createdDate: string;
  createdClientDate?: string | null;
  activeClientDate?: string | null;
  archiveDate?: string | null;
  dbas?: string[] | null;
  isCorporate?: boolean | null;
  corporateId?: string | null;
  firstFilePlacementDate?: string | null;
  mostRecentFilePlacementDate?: string | null;
  clientStatus?: GraphqlClientStatus;
  prospectStatus?: GraphqlProspectStatus;
  website?: string | null;
  linkedIn?: string | null;
  address?: {
    address1?: string | null;
    address2?: string | null;
    city: string;
    state: string;
    zipCode?: string | null;
  } | null;
  contactIds?: string[] | null;
  unitCount: number;
  onboardingChecklist?: OnboardingChecklist | null;
  metadata?: ClientMetadata | null;
};

export type ClientsQueryData = {
  currentUser: UserProfile | null;
  users: UserProfile[];
  allClients: GraphqlClient[];
  myClients: GraphqlClient[];
  prospects: GraphqlClient[];
};

type AllClientsQueryData = {
  allClients: GraphqlClient[];
};

type ClientByIdQueryData = {
  client: GraphqlClient | null;
};

type ClientByIdQueryVariables = {
  id: string;
};

export type ClientMutationData = {
  createClient?: GraphqlClient;
  createProspect?: GraphqlClient;
};

export type ClientMutationVariables = {
  input: {
    companyName: string;
    assignedRepId?: string;
    dbas?: string[];
    isCorporate?: boolean;
    website?: string;
    linkedIn?: string;
    address: {
      city: string;
      state: string;
      address1?: string;
      address2?: string;
      zipCode?: string;
    };
    contactIds?: string[];
    unitCount?: number;
    prospectStatus?: Exclude<GraphqlProspectStatus, null>;
  };
};

export type CreateClientServiceInput = {
  companyName: string;
  assignedRepId?: string;
  dbas?: string[];
  isCorporate?: boolean;
  website?: string;
  linkedIn?: string;
  address: {
    city: string;
    state: string;
    address1?: string;
    address2?: string;
    zipCode?: string;
  };
  contactIds?: string[];
  unitCount?: number;
};

export type CreateProspectServiceInput = CreateClientServiceInput & {
  prospectStatus: Exclude<GraphqlProspectStatus, null>;
};

export type UpdateClientMutationData = {
  updateClient: GraphqlClient;
};

export type UpdateClientMutationVariables = {
  id: string;
  input: {
    assignedRepId?: string;
    clientStatus?: Exclude<GraphqlClientStatus, null>;
    prospectStatus?: Exclude<GraphqlProspectStatus, null>;
    onboardingChecklist?: OnboardingChecklist | null;
    createdClientDate?: Date | string;
    address?: {
      address1?: string | null;
      address2?: string | null;
      city?: string | null;
      state?: string | null;
      zipCode?: string | null;
    };
    unitCount?: number;
    metadata?: Partial<ClientMetadata>;
  };
};

export const CLIENT_FIELDS = gql`
  fragment ClientFields on Client {
    id
    clientId
    companyName
    assignedRepId
    createdDate
    createdClientDate
    activeClientDate
    archiveDate
    dbas
    isCorporate
    corporateId
    firstFilePlacementDate
    mostRecentFilePlacementDate
    clientStatus
    prospectStatus
    website
    linkedIn
    address {
      address1
      address2
      city
      state
      zipCode
    }
    contactIds
    unitCount
    onboardingChecklist {
      agreement_signed
      property_list_created
      ach
      integration_setup
      first_file_placed
    }
    metadata {
      prelegal
      settled_in_full
      integration
      tax_campaign
    }
  }
`;

export const CLIENTS_DATA_QUERY = gql`
  query ClientsData {
    currentUser {
      id
      firstName
      lastName
      email
      title
      role
      initials
    }
    users {
      id
      firstName
      lastName
      email
      title
      role
      initials
    }
    allClients {
      ...ClientFields
    }
    myClients {
      ...ClientFields
    }
    prospects {
      ...ClientFields
    }
  }
  ${CLIENT_FIELDS}
`;

export const ALL_CLIENTS_QUERY = gql`
  query AllClients {
    allClients {
      ...ClientFields
    }
  }
  ${CLIENT_FIELDS}
`;

export const CLIENT_BY_ID_QUERY = gql`
  query ClientById($id: ID!) {
    client(id: $id) {
      ...ClientFields
    }
  }
  ${CLIENT_FIELDS}
`;

export const CREATE_CLIENT_MUTATION = gql`
  mutation CreateClient($input: CreateClientInput!) {
    createClient(input: $input) {
      ...ClientFields
    }
  }
  ${CLIENT_FIELDS}
`;

export const CREATE_PROSPECT_MUTATION = gql`
  mutation CreateProspect($input: CreateProspectInput!) {
    createProspect(input: $input) {
      ...ClientFields
    }
  }
  ${CLIENT_FIELDS}
`;

export const UPDATE_CLIENT_MUTATION = gql`
  mutation UpdateClient($id: ID!, $input: UpdateClientInput!) {
    updateClient(id: $id, input: $input) {
      ...ClientFields
    }
  }
  ${CLIENT_FIELDS}
`;

function toClientStatus(status?: GraphqlClient["clientStatus"]): Client["clientStatus"] {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "INACTIVE":
      return "inactive";
    case "PROSPECTING":
    default:
      return "prospecting";
  }
}

function toProspectStatus(status?: GraphqlClient["prospectStatus"]): Client["prospectStatus"] {
  switch (status) {
    case "VERBAL":
      return "verbal";
    case "NOT_STARTED":
      return "not_started";
    case "IN_COMMUNICATION":
      return "in_communication";
    case "AWAITING_REVIEW":
      return "awaiting_review";
    case "ONBOARDING":
      return "onboarding";
    case "CLOSED":
    default:
      return "closed";
  }
}

const DEFAULT_CLIENT_METADATA: ClientMetadata = {
  prelegal: false,
  settled_in_full: 0,
  integration: null,
  tax_campaign: false
};

export function normalizeClient(client: GraphqlClient): Client {
  return {
    id: client.id,
    clientId: client.clientId ?? "",
    companyName: client.companyName,
    assignedRepId: client.assignedRepId ?? "",
    createdDate: client.createdDate,
    archiveDate: client.archiveDate ?? null,
    clientCloseDate: client.activeClientDate ?? null,
    firstFilePlacementDate: client.firstFilePlacementDate ?? null,
    mostRecentFilePlacementDate: client.mostRecentFilePlacementDate ?? null,
    clientStatus: toClientStatus(client.clientStatus),
    prospectStatus: toProspectStatus(client.prospectStatus),
    dbas: client.dbas ?? [],
    isCorporate: client.isCorporate ?? false,
    website: client.website ?? "",
    linkedIn: client.linkedIn ?? "",
    address: {
      address1: client.address?.address1 ?? "",
      address2: client.address?.address2 ?? "",
      city: client.address?.city ?? "",
      state: client.address?.state ?? "",
      zipCode: client.address?.zipCode ?? ""
    },
    contactIds: client.contactIds ?? [],
    unitCount: client.unitCount,
    onboardingChecklist: client.onboardingChecklist ?? null,
    metadata: {
      ...DEFAULT_CLIENT_METADATA,
      ...(client.metadata ?? {})
    }
  };
}

let clientsRequest: Promise<Client[]> | null = null;

async function fetchClients(): Promise<Client[]> {
  const response = await apolloClient.query<AllClientsQueryData>({
    query: ALL_CLIENTS_QUERY,
    fetchPolicy: "network-only"
  });

  return response.data.allClients.map(normalizeClient);
}

export async function getClients(): Promise<Client[]> {
  if (!clientsRequest) {
    clientsRequest = fetchClients().finally(() => {
      clientsRequest = null;
    });
  }

  return clientsRequest;
}

export async function getClientById(id: string): Promise<Client | null> {
  if (!id) return null;

  const response = await apolloClient.query<ClientByIdQueryData, ClientByIdQueryVariables>({
    query: CLIENT_BY_ID_QUERY,
    variables: { id },
    fetchPolicy: "network-only"
  });

  return response.data.client ? normalizeClient(response.data.client) : null;
}

export async function getRepClients(assignedRepId: string): Promise<Client[]> {
  if (!assignedRepId) return [];

  const clients = await getClients();
  return clients.filter((client) => client.assignedRepId === assignedRepId);
}

export async function getProspectClients(): Promise<Client[]> {
  const clients = await getClients();
  return clients.filter((client) =>
    client.clientStatus === "prospecting" || client.prospectStatus === "onboarding"
  );
}

export async function createClient(input: CreateClientServiceInput, author:string, repId: string): Promise<Client> {
  const response = await apolloClient.mutate<ClientMutationData, ClientMutationVariables>({
    mutation: CREATE_CLIENT_MUTATION,
    variables: {
      input,
    },
  });

  if (!response.data?.createClient) {
    throw new Error("Client creation did not return a record.");
  }

  const client = normalizeClient(response.data.createClient);

  await createAuditLogEntry({
    clientId: client.id,
    action: "Created client",
    author: author,
    repId: repId,
    type: "create"
  });

  return client;
}

export async function createProspect(input: CreateProspectServiceInput, author: string, repId: string): Promise<Client> {
  const response = await apolloClient.mutate<ClientMutationData, ClientMutationVariables>({
    mutation: CREATE_PROSPECT_MUTATION,
    variables: {
      input,
    },
  });

  if (!response.data?.createProspect) {
    throw new Error("Prospect creation did not return a record.");
  }

  const client = normalizeClient(response.data.createProspect);

  await createAuditLogEntry({
    clientId: client.id,
    action: "Created prospect",
    author: author,
    repId: repId,
    type: "create"
  });

  return client;
}

export async function updateClient(
  id: string,
  input: UpdateClientMutationVariables["input"],
  repId: string,
  auditMessage: string,
): Promise<Client> {
  const response = await apolloClient.mutate<UpdateClientMutationData, UpdateClientMutationVariables>({
    mutation: UPDATE_CLIENT_MUTATION,
    variables: {
      id,
      input
    }
  });

  const updatedClient = response.data?.updateClient;
  if (!updatedClient) {
    throw new Error("Client update did not return a record.");
  }

  await createAuditLogEntry({
    clientId: updatedClient.id,
    action: auditMessage,
    author: repId,
    repId,
    type: "update"
  });

  return normalizeClient(updatedClient);
}
