import { createContext, useContext, useState, type ReactNode } from "react";
import type { Client, UserProfile } from "@/types/api";
import {
  MOCK_ALL_CLIENTS, MOCK_MY_CLIENTS, MOCK_USER,
  CLIENT_EXTRA_DETAILS, type ClientExtra, type ClientWithBucket,
} from "@/lib/mock-data";

type AllClient = Client;

interface ClientsCtx {
  allClients: AllClient[];
  myClients: ClientWithBucket[];
  clientExtras: Record<string, ClientExtra>;
  addClient: (data: NewClientData) => void;
}

export interface NewClientData {
  companyName: string;
  dbas: string;
  website: string;
  linkedin: string;
  city: string;
  state: string;
  unitCount: number;
  assignedRep: UserProfile;
}

let nextClientNum = 2000;

const ClientsContext = createContext<ClientsCtx | null>(null);

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [allClients, setAllClients] = useState<AllClient[]>(MOCK_ALL_CLIENTS);
  const [myClients, setMyClients] = useState<ClientWithBucket[]>(MOCK_MY_CLIENTS);
  const [clientExtras, setClientExtras] = useState<Record<string, ClientExtra>>(CLIENT_EXTRA_DETAILS);

  function addClient(data: NewClientData) {
    const id = `new-${Date.now()}`;
    const clientId = `CLT-${nextClientNum++}`;
    const now = new Date().toISOString();

    const newClient: AllClient = {
      id,
      clientId,
      companyName: data.companyName,
      headquarters: `${data.city}, ${data.state}`,
      unitCount: data.unitCount,
      firstPlacementDate: null,
      lastPlacementDate: null,
      assignedRepId: data.assignedRep.id,
      assignedRep: data.assignedRep,
      createdAt: now,
    };

    setAllClients(prev => [newClient, ...prev]);

    // Store extra details (website, linkedin, dbas)
    if (data.website || data.linkedin || data.dbas) {
      setClientExtras(prev => ({
        ...prev,
        [id]: {
          website: data.website || "",
          linkedin: data.linkedin || "",
          primaryContact: { name: "", title: "", phone: "", email: "", linkedin: "" },
        },
      }));
    }

    // If assigned to the logged-in user, also add to myClients
    if (data.assignedRep.id === MOCK_USER.id) {
      const myClient: ClientWithBucket = {
        ...newClient,
        bucket: 1,
        totalPlacements: 0,
        placementsThisYear: 0,
        recoveryRate: 0,
      };
      setMyClients(prev => [myClient, ...prev]);
    }
  }

  return (
    <ClientsContext.Provider value={{ allClients, myClients, clientExtras, addClient }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients(): ClientsCtx {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used inside ClientsProvider");
  return ctx;
}
