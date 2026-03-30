import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { createContext, useContext, type ReactNode } from "react";
import type { Client, UserProfile } from "@/types/api";
import { CLIENT_EXTRA_DETAILS, type ClientExtra } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";

type AllClient = Client;

interface ClientsCtx {
  allClients: AllClient[];
  myClients: AllClient[];
  prospects: AllClient[];
  reps: UserProfile[];
  currentUser: UserProfile | null;
  clientExtras: Record<string, ClientExtra>;
  loading: boolean;
  error: string | null;
  addClient: (data: NewClientData) => Promise<AllClient>;
  addProspect: (data: NewProspectData) => Promise<AllClient>;
}

export interface BaseClientMutationData {
  companyName: string;
  dbas: string[];
  website: string;
  linkedIn: string;
  city: string;
  state: string;
  unitCount: number;
  assignedRepId: string;
}

export interface NewClientData extends BaseClientMutationData {
  isCorporate?: boolean;
}

export interface NewProspectData extends BaseClientMutationData {
  prospectStatus: "verbal" | "not_started" | "in_communication" | "awaiting_review" | "closed";
  isCorporate?: boolean;
}

type GraphqlClient = {
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
  clientStatus?: "ACTIVE" | "INACTIVE" | "PROSPECTING" | null;
  prospectStatus?: "VERBAL" | "NOT_STARTED" | "IN_COMMUNICATION" | "AWAITING_REVIEW" | "CLOSED" | null;
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
};

type ClientsQueryData = {
  currentUser: UserProfile | null;
  users: UserProfile[];
  allClients: GraphqlClient[];
  myClients: GraphqlClient[];
  prospects: GraphqlClient[];
};

type ClientMutationData = {
  createClient?: GraphqlClient;
  createProspect?: GraphqlClient;
};

type ClientMutationVariables = {
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
    prospectStatus?: "VERBAL" | "NOT_STARTED" | "IN_COMMUNICATION" | "AWAITING_REVIEW" | "CLOSED";
  };
};

const CLIENT_FIELDS = gql`
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
  }
`;

const CLIENTS_DATA_QUERY = gql`
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

const CREATE_CLIENT_MUTATION = gql`
  mutation CreateClient($input: CreateClientInput!) {
    createClient(input: $input) {
      ...ClientFields
    }
  }
  ${CLIENT_FIELDS}
`;

const CREATE_PROSPECT_MUTATION = gql`
  mutation CreateProspect($input: CreateProspectInput!) {
    createProspect(input: $input) {
      ...ClientFields
    }
  }
  ${CLIENT_FIELDS}
`;

const ClientsContext = createContext<ClientsCtx | null>(null);

function toClientStatus(status?: GraphqlClient["clientStatus"]): Client["status"] {
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
    case "CLOSED":
    default:
      return "closed";
  }
}

function normalizeClient(client: GraphqlClient): Client {
  return {
    id: client.id,
    clientId: client.clientId ?? client.id,
    companyName: client.companyName,
    assignedRepId: client.assignedRepId ?? "",
    createdDate: client.createdDate,
    archiveDate: client.archiveDate ?? null,
    clientCloseDate: client.activeClientDate ?? null,
    firstFilePlacementDate: client.firstFilePlacementDate ?? null,
    mostRecentFilePlacementDate: client.mostRecentFilePlacementDate ?? null,
    status: toClientStatus(client.clientStatus),
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
    unitCount: client.unitCount
  };
}

function toMutationInput(data: BaseClientMutationData) {
  return {
    companyName: data.companyName.trim(),
    assignedRepId: data.assignedRepId || undefined,
    dbas: data.dbas.filter(Boolean),
    website: data.website.trim() || undefined,
    linkedIn: data.linkedIn.trim() || undefined,
    address: {
      city: data.city.trim(),
      state: data.state.trim()
    },
    contactIds: [],
    unitCount: data.unitCount || 0
  };
}

function toProspectEnum(
  value: NewProspectData["prospectStatus"]
): ClientMutationVariables["input"]["prospectStatus"] {
  switch (value) {
    case "verbal":
      return "VERBAL";
    case "not_started":
      return "NOT_STARTED";
    case "in_communication":
      return "IN_COMMUNICATION";
    case "awaiting_review":
      return "AWAITING_REVIEW";
    case "closed":
    default:
      return "CLOSED";
  }
}

export function ClientsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data, loading, error } = useQuery<ClientsQueryData>(CLIENTS_DATA_QUERY, {
    skip: !user || user.role === "client"
  });
  const [createClientMutation] = useMutation<ClientMutationData, ClientMutationVariables>(
    CREATE_CLIENT_MUTATION
  );
  const [createProspectMutation] = useMutation<ClientMutationData, ClientMutationVariables>(
    CREATE_PROSPECT_MUTATION
  );

  async function addClient(data: NewClientData) {
    const response = await createClientMutation({
      variables: {
        input: {
          ...toMutationInput(data),
          isCorporate: data.isCorporate ?? false
        }
      },
      refetchQueries: [{ query: CLIENTS_DATA_QUERY }],
      awaitRefetchQueries: true
    });

    if (!response.data?.createClient) {
      throw new Error("Client creation did not return a record.");
    }

    return normalizeClient(response.data.createClient);
  }

  async function addProspect(data: NewProspectData) {
    const response = await createProspectMutation({
      variables: {
        input: {
          ...toMutationInput(data),
          isCorporate: data.isCorporate ?? false,
          prospectStatus: toProspectEnum(data.prospectStatus)
        }
      },
      refetchQueries: [{ query: CLIENTS_DATA_QUERY }],
      awaitRefetchQueries: true
    });

    if (!response.data?.createProspect) {
      throw new Error("Prospect creation did not return a record.");
    }

    return normalizeClient(response.data.createProspect);
  }

  const allClients = (data?.allClients ?? []).map(normalizeClient);
  const myClients = (data?.myClients ?? []).map(normalizeClient);
  const prospects = (data?.prospects ?? []).map(normalizeClient);
  const reps = (data?.users ?? []).map((user) => ({
    ...user,
    password: undefined
  }));
  const currentUser = data?.currentUser
    ? {
        ...data.currentUser,
        password: undefined
      }
    : null;

  return (
    <ClientsContext.Provider
      value={{
        allClients,
        myClients,
        prospects,
        reps,
        currentUser,
        clientExtras: CLIENT_EXTRA_DETAILS,
        loading,
        error: error?.message ?? null,
        addClient,
        addProspect
      }}
    >
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients(): ClientsCtx {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used inside ClientsProvider");
  return ctx;
}
