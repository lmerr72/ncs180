import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProspectStatuses } from "@/types/constants";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2, Users, BarChart2, Percent,
  Globe, Phone, ExternalLink, UserPlus, X,
  Clock, Check, ChevronDown,
  BriefcaseBusiness, Sparkles, Pencil, Trash2,
} from "lucide-react";
import { DetailCard } from "@/components/shared/DetailCard";
import { LinkedInIcon, LinkedInUpdatesCard, type LinkedInPostItem } from "@/components/shared/LinkedInUpdatesCard";
import { createBrowserLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import type { AuditEntry, Client, ClientMetadata, Importance, Note, OnboardingChecklist, ProspectStatus, UserProfile } from "@/types/api";
import type { ExtendedTask } from "@/services/taskService";
import { ClientStatus,TaskType } from "@/types/api";
import { MOCK_CONTACTS } from "@/data/mock_contacts";
import { formatLabel, getInitials } from "@/helpers/formatters";
import { useAuth } from "@/context/AuthContext";
import { OnboardingWidget } from "./widgets/OnboardingWidget";
import { IntegrationHealthWidget } from "./widgets/IntegrationHealthWidget";
import { STATUS_CONFIG } from "./constants";
import NotesWidget from "@/components/shared/NotesWidget";
import AuditLogWidget from "@/components/shared/AuditLogWidget";
import { CopyableEmail } from "@/components/shared/CopyableEmail";
import OutlookEmailWidget from "@/components/shared/OutlookEmailWidget";
import { StatusModal } from "./modals/StatusModal";
import { AddTaskModal } from "./modals/AddTaskModal";
import { AccountHistoryWidget, type HistoryEntry } from "./widgets/AccountHistoryWidget";
import { ApolloAccountSnapshot, type ApolloSnapshotResponse } from "./widgets/ApolloAccountSnapshot";
import { ApolloContactHealthWidget, type ApolloContactHealthEntry, type ApolloContactHealthResponse } from "./widgets/ApolloContactHealthWidget";
import { ApolloContactsWizard, type ApolloContactWizardCandidate } from "./modals/ApolloContactsWizard";
import { EditClientInformationModal, type EditableClientInformationForm } from "./modals/EditClientInformationModal";
import { ClientMetadataWidget } from "./widgets/ClientMetadataWidget";
import { ClientInformationWidget } from "./widgets/ClientInformationWidget";
import { DeleteContactConfirmModal } from "./modals/DeleteContactConfirmModal";
import { EditContactModal, type EditableContactForm } from "./modals/EditContactModal";
import { ClientPlacementMetricsWidget } from "./widgets/ClientPlacementMetricsWidget";
import { ClientPortfolioHierarchy } from "./widgets/ClientPortfolioHierarchy";
import { ClientReportingStats } from "./widgets/ClientReportingStats";
import { ClientReportingTable } from "./ClientReportingTable";
import { RelatedTasksWidget } from "./widgets/RelatedTasksWidget";
import {
  CLIENT_CONTACTS_QUERY,
  type ClientContactsQueryData,
  bulkCreateContacts,
  createContact,
  deleteContact,
  updateContact,
} from "@/services/contactService";
import {
  getClientById,
  getClients,
  updateClient,
} from "@/services/clientService";
import { createTask, getTasks, updateTask } from "@/services/taskService";
import { getUsersContext } from "@/services/userService";

const logger = createBrowserLogger("ClientProfile");

const bucketColors: Record<number, string> = {
  1: "bg-sky-100 text-sky-700 border border-sky-200",
  2: "bg-violet-100 text-violet-700 border border-violet-200",
  3: "bg-amber-100 text-amber-700 border border-amber-200",
};

type InactiveReason = "Moved to another company" | "Integration issues" | "Not a good fit" | "Other";

type Contact = { id: string; firstName: string; lastName: string; title: string; email: string; phone: string; linkedIn: string; isPrimary?: boolean };
type ApolloContactCandidate = {
  id: string | null;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  linkedIn: string;
  city: string;
  state: string;
  seniority: string;
  emailStatus?: "available" | "enriched" | "missing";
};
type ApolloCompanyContactsResponse = {
  configured: boolean;
  contacts: ApolloContactCandidate[];
  warnings: string[];
  error?: string;
};
const DEFAULT_CLIENT_METADATA: ClientMetadata = {
  prelegal: false,
  settled_in_full: 0,
  integration: null,
  tax_campaign: false,
};

function formatMetadataAuditValue(field: keyof ClientMetadata, value: ClientMetadata[keyof ClientMetadata]) {
  if (field === "integration") {
    if (typeof value !== "string" || value.length === 0) return "No integration";

    return value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

const PROSPECT_STATUS_CONFIG: Record<Exclude<ProspectStatus, "inactive">, { badge: string; dot: string }> = {
  not_started:      { badge: "bg-slate-100 text-slate-700 border border-slate-200",           dot: "bg-slate-500" },
  in_communication: { badge: "bg-sky-100 text-sky-700 border border-sky-200",                 dot: "bg-sky-500" },
  awaiting_review:  { badge: "bg-violet-100 text-violet-700 border border-violet-200",        dot: "bg-violet-500" },
  verbal:           { badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",     dot: "bg-emerald-500" },
  onboarding:       { badge: "bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200",     dot: "bg-fuchsia-500" },
  closed:           { badge: "bg-amber-100 text-amber-700 border border-amber-200",           dot: "bg-amber-500" },
};
const PROSPECT_STATUS_OPTIONS = ProspectStatuses as Exclude<ProspectStatus, "inactive">[];

const SEED_HISTORY: HistoryEntry[] = [
  { id: "h1", type: "meeting", subject: "Quarterly business review", summary: "Reviewed placement trends and expansion plans for two new properties.", actor: "Gordon Marshall", timestamp: "2026-03-12T15:00:00Z" },
  { id: "h2", type: "email", subject: "Follow-up proposal sent", summary: "Sent pricing recap and implementation timeline after the QBR.", actor: "Gordon Marshall", timestamp: "2026-03-12T18:20:00Z" },
  { id: "h3", type: "call", subject: "Operations check-in", summary: "Confirmed onboarding questions were resolved and next review is set for April.", actor: "Jennifer Walsh", timestamp: "2026-03-05T17:30:00Z" },
  { id: "h4", type: "email", subject: "Collections performance recap", summary: "Shared February recovery-rate summary with notes on underperforming sites.", actor: "Gordon Marshall", timestamp: "2026-02-28T16:10:00Z" },
];

const LINKEDIN_POSTS_BY_COMPANY_URL: Record<string, LinkedInPostItem[]> = {
  "https://www.linkedin.com/company/griffisblessing-inc-": [],
};

function normalizeLinkedInCompanyUrl(url: string | null | undefined): string {
  if (!url) return "";

  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString().replace(/\/+$/, "").toLowerCase();
  } catch {
    return url.trim().replace(/\/+$/, "").toLowerCase();
  }
}

function toLinkedInEmbedUrl(postUrl: string): string {
  if (postUrl.includes("/embed/feed/update/")) return postUrl;

  try {
    const parsed = new URL(postUrl);
    if (parsed.hostname.includes("linkedin.com") && parsed.pathname.startsWith("/feed/update/")) {
      parsed.pathname = parsed.pathname.replace("/feed/update/", "/embed/feed/update/");
      parsed.search = "";
      parsed.hash = "";
      return parsed.toString();
    }
  } catch {
    return postUrl;
  }

  return postUrl;
}

function getLinkedInPosts(companyLinkedInUrl: string): LinkedInPostItem[] {
  const normalizedUrl = normalizeLinkedInCompanyUrl(companyLinkedInUrl);
  const posts = LINKEDIN_POSTS_BY_COMPANY_URL[normalizedUrl] ?? [];

  return posts
    .map(post => ({
      ...post,
      embedUrl: toLinkedInEmbedUrl(post.embedUrl || post.postUrl),
    }))
    .slice(0, 3);
}

function toProspectStatusEnum(status: Exclude<ProspectStatus, "inactive">) {
  switch (status) {
    case "not_started":
      return "NOT_STARTED";
    case "in_communication":
      return "IN_COMMUNICATION";
    case "awaiting_review":
      return "AWAITING_REVIEW";
    case "verbal":
      return "VERBAL";
    case "onboarding":
      return "ONBOARDING";
    case "closed":
    default:
      return "CLOSED";
  }
}

function getDisplayStatus(
  clientStatus: ClientStatus | null | undefined,
  prospectStatus: ProspectStatus | null | undefined,
): ClientStatus {
  if (prospectStatus === "onboarding") {
    return "onboarding";
  }

  return clientStatus ?? "active";
}

function isPipelineStatus(
  clientStatus: ClientStatus | null | undefined,
  prospectStatus: ProspectStatus | null | undefined,
): boolean {
  return clientStatus === "prospecting" || prospectStatus === "onboarding";
}

function createClientInformationForm(client: Client | null): EditableClientInformationForm {
  return {
    unitCount: client?.unitCount?.toString() ?? "0",
    address1: client?.address?.address1 ?? "",
    address2: client?.address?.address2 ?? "",
    city: client?.address?.city ?? "",
    state: client?.address?.state ?? "",
    zipCode: client?.address?.zipCode ?? "",
  };
}


export default function ClientProfile() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const outlookReturnTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    params.delete("outlook");
    params.delete("outlook_error");
    const search = params.toString();
    return `${location.pathname}${search ? `?${search}` : ""}`;
  }, [location.pathname, location.search]);
  const { user } = useAuth();
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [reps, setReps] = useState<UserProfile[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [clientLoading, setClientLoading] = useState(true);
  const from = searchParams.get("from");

  const fromMyClients = from === "my-clients";
  const fromPipeline = from === "pipeline";
  const originLabel = fromPipeline ? "Pipeline" : fromMyClients ? "My Clients" : "Clients";
  const originHref = fromPipeline ? "/pipeline" : fromMyClients ? "/my-clients" : "/clients";

  const routeState = location.state as { client?: Client; prospect?: Client } | null;
  const routeStateClient = routeState?.client ?? routeState?.prospect ?? null;
  const initialAssignedRep = reps.find(r => r.id === client?.assignedRepId) ?? null;

  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const companyWebsiteUrl = client?.website ?? "";
  const companyLinkedInUrl = client?.linkedIn ?? "";
  const linkedInPosts = getLinkedInPosts(companyLinkedInUrl);
  const myClient = allClients.find(
    (entry) => entry.id === client?.id || entry.companyName === client?.companyName
  ) ?? null;
  const { data: contactsData } = useQuery<ClientContactsQueryData>(CLIENT_CONTACTS_QUERY, {
    variables: {
      clientId: client?.id ?? ""
    },
    skip: !client?.id
  });
  // Status state
  const [status, setStatus] = useState<ClientStatus>(
    getDisplayStatus(client?.clientStatus, client?.prospectStatus)
  ); // hippo replace default with laoder when client isnt ready
  const [displayClientId, setDisplayClientId] = useState(client?.clientId ?? "");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [prospectStatus, setProspectStatus] = useState<Exclude<ProspectStatus, "inactive">>(
    (client?.prospectStatus && client.prospectStatus !== "inactive" ? client.prospectStatus : "not_started")
  );
  const [onboardingChecklist, setOnboardingChecklist] = useState<OnboardingChecklist | null>(
    client?.onboardingChecklist ?? null
  );
  const [metadataForm, setMetadataForm] = useState<ClientMetadata>({
    ...DEFAULT_CLIENT_METADATA,
    ...(client?.metadata ?? {}),
  });
  const [metadataSaving, setMetadataSaving] = useState(false);
  const [metadataEditing, setMetadataEditing] = useState(false);
  const [clientInformationForm, setClientInformationForm] = useState<EditableClientInformationForm>(
    createClientInformationForm(client)
  );
  const [clientInformationSaving, setClientInformationSaving] = useState(false);
  const [showClientInformationModal, setShowClientInformationModal] = useState(false);
  const [showProspectStatusDropdown, setShowProspectStatusDropdown] = useState(false);
  const [prospectStatusSaving, setProspectStatusSaving] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [apolloSnapshot, setApolloSnapshot] = useState<ApolloSnapshotResponse | null>(null);
  const [apolloLoading, setApolloLoading] = useState(false);
  const [apolloError, setApolloError] = useState<string | null>(null);
  const [apolloSnapshotEnabled, setApolloSnapshotEnabled] = useState(false);
  const apolloSnapshotAbortRef = useRef<AbortController | null>(null);

  // Assigned rep state
  const [assignedRep, setAssignedRep] = useState(initialAssignedRep);
  const [repPending, setRepPending] = useState(false);
  const [showRepDropdown, setShowRepDropdown] = useState(false);
  const repDropdownRef = useRef<HTMLDivElement>(null);
  const prospectStatusDropdownRef = useRef<HTMLDivElement>(null);

  // Toast state
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setClientLoading(true);

      try {
        const [clients, usersData, selectedClient] = await Promise.all([
          getClients(),
          getUsersContext(),
          id ? getClientById(id) : Promise.resolve(null),
        ]);

        if (ignore) return;

        const fallbackClient = clients.find((entry) => entry.id === id || entry.clientId === id) ?? null;

        setAllClients(clients);
        setReps(usersData.users);
        setClient(selectedClient ?? fallbackClient ?? routeStateClient);
      } finally {
        if (!ignore) {
          setClientLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, [id, routeStateClient]);

  useEffect(() => {
    if (!user?.repId || !client?.id) {
      setTasks([]);
      return;
    }

    let ignore = false;

    async function loadTasks() {
      try {
        const nextTasks = await getTasks(user.repId, client.id);
        if (!ignore) {
          setTasks(nextTasks);
        }
      } catch (error) {
        logger.error("Failed to load client tasks", {
          clientId: client.id,
          repId: user.repId,
          error
        });
      }
    }

    void loadTasks();

    return () => {
      ignore = true;
    };
  }, [client?.id, user?.repId]);

  useEffect(() => {
    if (!showRepDropdown) return;
    function handleClick(e: MouseEvent) {
      if (repDropdownRef.current && !repDropdownRef.current.contains(e.target as Node)) {
        setShowRepDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showRepDropdown]);

  useEffect(() => {
    if (!showProspectStatusDropdown) return;
    function handleClick(e: MouseEvent) {
      if (
        prospectStatusDropdownRef.current
        && !prospectStatusDropdownRef.current.contains(e.target as Node)
      ) {
        setShowProspectStatusDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProspectStatusDropdown]);

  useEffect(() => {
    setStatus(getDisplayStatus(client?.clientStatus, client?.prospectStatus));
  }, [client?.clientStatus, client?.prospectStatus]);

  useEffect(() => {
    setAssignedRep(reps.find((rep) => rep.id === client?.assignedRepId) ?? null);
  }, [client?.assignedRepId, reps]);

  const isProspectView = isPipelineStatus(status, prospectStatus);

  useEffect(() => {
    if (client?.prospectStatus && client.prospectStatus !== "inactive") {
      setProspectStatus(client.prospectStatus);
    }
  }, [client?.prospectStatus]);

  useEffect(() => {
    setDisplayClientId(client?.clientId ?? "");
  }, [client?.clientId]);

  useEffect(() => {
    setOnboardingChecklist(client?.onboardingChecklist ?? null);
  }, [client?.onboardingChecklist]);

  useEffect(() => {
    setMetadataForm({
      ...DEFAULT_CLIENT_METADATA,
      ...(client?.metadata ?? {}),
    });
  }, [client?.metadata]);

  useEffect(() => {
    setClientInformationForm(createClientInformationForm(client));
  }, [client]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function updateMetadataForm<K extends keyof ClientMetadata>(field: K, value: ClientMetadata[K]) {
    setMetadataForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSaveMetadata() {
    if (!client?.id || metadataSaving) return;

    const currentMetadata: ClientMetadata = {
      ...DEFAULT_CLIENT_METADATA,
      ...(client.metadata ?? {}),
    };
    const nextMetadata: ClientMetadata = {
      prelegal: metadataForm.prelegal,
      settled_in_full: Number.isFinite(metadataForm.settled_in_full) ? metadataForm.settled_in_full : 0,
      integration: metadataForm.integration,
      tax_campaign: metadataForm.tax_campaign,
    };
    const updatedFields = (Object.keys(nextMetadata) as Array<keyof ClientMetadata>)
      .filter((field) => currentMetadata[field] !== nextMetadata[field]);

    if (updatedFields.length === 0) {
      setMetadataEditing(false);
      return;
    }

    const auditMessage = `Client metadata updated: ${updatedFields
      .map((field) => `${field} from ${formatMetadataAuditValue(field, currentMetadata[field])} to ${formatMetadataAuditValue(field, nextMetadata[field])}`)
      .join("; ")}`;

    setMetadataSaving(true);
    try {
      const response = await updateClient(
        client.id,
        { metadata: nextMetadata },
        user?.repId ?? "",
        auditMessage
      );
      const savedMetadata = response.metadata ?? nextMetadata;

      setClient((current) => current ? { ...current, metadata: savedMetadata } : current);
      setAllClients((current) =>
        current.map((entry) => entry.id === client.id ? { ...entry, metadata: savedMetadata } : entry)
      );
      setMetadataForm(savedMetadata);
      setMetadataEditing(false);
      showToast("Client details updated");
    } catch (error) {
      logger.error("Failed to save client metadata", {
        clientId: client.id,
        error,
      });
      showToast(error instanceof Error ? error.message : "Unable to update client details.");
    } finally {
      setMetadataSaving(false);
    }
  }

  async function handleSaveClientInformation() {
    if (!client?.id || clientInformationSaving) return;

    const nextUnitCount = Math.max(0, Number.parseInt(clientInformationForm.unitCount, 10) || 0);
    const nextAddress = {
      address1: clientInformationForm.address1.trim(),
      address2: clientInformationForm.address2.trim(),
      city: clientInformationForm.city.trim(),
      state: clientInformationForm.state.trim(),
      zipCode: clientInformationForm.zipCode.trim(),
    };
    const currentAddress = {
      address1: client.address?.address1 ?? "",
      address2: client.address?.address2 ?? "",
      city: client.address?.city ?? "",
      state: client.address?.state ?? "",
      zipCode: client.address?.zipCode ?? "",
    };
    const changes: string[] = [];

    if (client.unitCount !== nextUnitCount) {
      changes.push(`unit count from ${client.unitCount.toLocaleString()} to ${nextUnitCount.toLocaleString()}`);
    }

    if (JSON.stringify(currentAddress) !== JSON.stringify(nextAddress)) {
      changes.push("full address updated");
    }

    if (changes.length === 0) {
      setShowClientInformationModal(false);
      return;
    }

    setClientInformationSaving(true);

    try {
      const updatedClient = await updateClient(
        client.id,
        {
          unitCount: nextUnitCount,
          address: nextAddress,
        },
        user?.repId ?? "",
        `Client information updated: ${changes.join("; ")}`
      );

      setClient(updatedClient);
      setAllClients((current) =>
        current.map((entry) => entry.id === updatedClient.id ? { ...entry, ...updatedClient } : entry)
      );
      setClientInformationForm(createClientInformationForm(updatedClient));
      setShowClientInformationModal(false);
      showToast("Client information updated");
    } catch (error) {
      logger.error("Failed to save client information", {
        clientId: client.id,
        error,
      });
      showToast(error instanceof Error ? error.message : "Unable to update client information.");
    } finally {
      setClientInformationSaving(false);
    }
  }

  function handleRepSelect(rep: UserProfile) {
    setAssignedRep(rep);
    setRepPending(true);
    setShowRepDropdown(false);
    addAudit(`Reassignment requested: ${rep.firstName} ${rep.lastName}`, "update");
    showToast("Reassignment request sent — awaiting approval");
  }

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ firstName: "", lastName: "", title: "", email: "", phone: "", linkedIn: "" });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [apolloContactSyncing, setApolloContactSyncing] = useState(false);
  const [showApolloContactsWizard, setShowApolloContactsWizard] = useState(false);
  const [apolloContactCandidates, setApolloContactCandidates] = useState<ApolloContactWizardCandidate[]>([]);
  const [apolloContactWarnings, setApolloContactWarnings] = useState<string[]>([]);
  const [apolloBulkSaving, setApolloBulkSaving] = useState(false);
  const [apolloContactHealth, setApolloContactHealth] = useState<ApolloContactHealthResponse | null>(null);
  const [apolloContactHealthLoading, setApolloContactHealthLoading] = useState(false);
  const [apolloContactHealthError, setApolloContactHealthError] = useState<string | null>(null);
  const [apolloContactHealthEnabled, setApolloContactHealthEnabled] = useState(false);
  const [editingContact, setEditingContact] = useState<EditableContactForm | null>(null);
  const [editContactSaving, setEditContactSaving] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [contactPendingDelete, setContactPendingDelete] = useState<Contact | null>(null);
  const apolloContactHealthAbortRef = useRef<AbortController | null>(null);

  // Account history state
  const [history] = useState<HistoryEntry[]>(SEED_HISTORY);

  // Audit log state


  useEffect(() => {
    const backendContacts = (contactsData?.contacts ?? []).map((contact) => ({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      title: contact.title ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      linkedIn: contact.linkedIn ?? "",
      isPrimary: contact.isPrimary ?? false
    }));

    if (backendContacts.length > 0) {
      setContacts(backendContacts);
      return;
    }

    setContacts([]);
  }, [contactsData]);

  function resetApolloSnapshot() {
    apolloSnapshotAbortRef.current?.abort();
    apolloSnapshotAbortRef.current = null;
    setApolloSnapshot(null);
    setApolloError(null);
    setApolloLoading(false);
  }

  function fetchApolloSnapshot() {
    if (!client?.companyName) {
      setApolloSnapshot(null);
      setApolloError(null);
      setApolloLoading(false);
      return;
    }

    apolloSnapshotAbortRef.current?.abort();
    const controller = new AbortController();
    apolloSnapshotAbortRef.current = controller;
    const params = new URLSearchParams({
      companyName: client.companyName,
    });

    if (companyWebsiteUrl) {
      params.set("website", companyWebsiteUrl);
    }

    setApolloLoading(true);
    setApolloError(null);

    fetch(`/api/apollo/account-snapshot?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json() as ApolloSnapshotResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load Apollo account snapshot.");
        }

        setApolloSnapshot(payload);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setApolloSnapshot(null);
        setApolloError(error instanceof Error ? error.message : "Unable to load Apollo account snapshot.");
      })
      .finally(() => {
        if (apolloSnapshotAbortRef.current === controller) {
          apolloSnapshotAbortRef.current = null;
        }

        if (!controller.signal.aborted) {
          setApolloLoading(false);
        }
      });
  }

  function handleApolloSnapshotToggle(enabled: boolean) {
    setApolloSnapshotEnabled(enabled);

    if (enabled) {
      fetchApolloSnapshot();
      return;
    }

    resetApolloSnapshot();
  }

  function resetApolloContactHealth() {
    apolloContactHealthAbortRef.current?.abort();
    apolloContactHealthAbortRef.current = null;
    setApolloContactHealth(null);
    setApolloContactHealthError(null);
    setApolloContactHealthLoading(false);
  }

  function fetchApolloHealth() {
    if (!client?.companyName || contacts.length === 0) {
      setApolloContactHealth(null);
      setApolloContactHealthError(null);
      setApolloContactHealthLoading(false);
      return;
    }

    apolloContactHealthAbortRef.current?.abort();
    const controller = new AbortController();
    apolloContactHealthAbortRef.current = controller;
    setApolloContactHealthLoading(true);
    setApolloContactHealthError(null);

    fetch("/api/apollo/contact-health", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        companyName: client.companyName,
        website: companyWebsiteUrl,
        contacts: contacts.map((contact) => ({
          firstName: contact.firstName,
          lastName: contact.lastName,
          title: contact.title,
          email: contact.email,
          phone: contact.phone,
          linkedIn: contact.linkedIn,
        })),
      }),
    })
      .then(async (response) => {
        const payload = await response.json() as ApolloContactHealthResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load Apollo contact health.");
        }

        setApolloContactHealth(payload);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setApolloContactHealth(null);
        setApolloContactHealthError(error instanceof Error ? error.message : "Unable to load Apollo contact health.");
      })
      .finally(() => {
        if (apolloContactHealthAbortRef.current === controller) {
          apolloContactHealthAbortRef.current = null;
        }

        if (!controller.signal.aborted) {
          setApolloContactHealthLoading(false);
        }
      });
  }

  function handleApolloContactHealthToggle(enabled: boolean) {
    setApolloContactHealthEnabled(enabled);

    if (enabled) {
      fetchApolloHealth();
      return;
    }

    resetApolloContactHealth();
  }

  useEffect(() => () => {
    apolloSnapshotAbortRef.current?.abort();
  }, []);

  useEffect(() => () => {
    apolloContactHealthAbortRef.current?.abort();
  }, []);

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!newContact.firstName.trim() || !newContact.lastName.trim() || !client?.id) return;
    setContactSaving(true);
    setContactError(null);

    try {
      const created = await createContact(
        client.id,
        {
          firstName: newContact.firstName.trim(),
          lastName: newContact.lastName.trim(),
          title: newContact.title.trim() || undefined,
          email: newContact.email.trim() || undefined,
          phone: newContact.phone.trim() || undefined,
          linkedIn: newContact.linkedIn.trim() || undefined,
          isPrimary: contacts.length === 0
        },
        user?.repId ?? "unknown-rep"
      );

      const contact: Contact = {
        id: created.id,
        firstName: created.firstName,
        lastName: created.lastName,
        title: created.title ?? "",
        email: created.email ?? "",
        phone: created.phone ?? "",
        linkedIn: created.linkedIn ?? "",
        isPrimary: created.isPrimary ?? false
      };
      setContacts(prev => [...prev, contact]);
      setNewContact({ firstName: "", lastName: "", title: "", email: "", phone: "", linkedIn: "" });
      setShowAddContact(false);
      showToast("Contact added");
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "Unable to add contact.");
    } finally {
      setContactSaving(false);
    }
  }

  async function handleApolloContactEnrichment() {
    if (!client?.id || !client.companyName) {
      return;
    }

    setApolloContactSyncing(true);
    setContactError(null);

    try {
      const response = await fetch("/api/apollo/company-contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: client.companyName,
          website: companyWebsiteUrl,
        }),
      });

      const payload = await response.json() as ApolloCompanyContactsResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to fetch Apollo company contacts.");
      }

      const existingKeys = new Set(
        contacts.flatMap((contact) => {
          const nameKey = `${contact.firstName} ${contact.lastName}`.trim().toLowerCase();
          return [
            contact.email?.trim().toLowerCase(),
            contact.linkedIn?.trim().toLowerCase(),
            nameKey ? `${nameKey}|${(contact.title || "").trim().toLowerCase()}` : "",
          ].filter(Boolean);
        })
      );

      const candidatesToReview = payload.contacts
        .map((candidate, index) => {
          const lastName = candidate.lastName ?? "";
          const nameKey = `${candidate.firstName} ${lastName}`.trim().toLowerCase();
          const dedupeKey = candidate.email?.trim().toLowerCase()
            || candidate.linkedIn?.trim().toLowerCase()
            || (nameKey ? `${nameKey}|${(candidate.title || "").trim().toLowerCase()}` : `apollo-${index}`);
          const alreadyExists = existingKeys.has(dedupeKey);

          return {
            ...candidate,
            lastName,
            dedupeKey,
            alreadyExists,
            selected: false,
          };
        })
        .filter((candidate) => candidate.firstName.trim().length > 0);

      if (candidatesToReview.length === 0) {
        const warning = payload.warnings?.[0];
        showToast(warning || "Apollo did not find any contacts to review.");
        return;
      }

      setApolloContactCandidates(candidatesToReview);
      setApolloContactWarnings(payload.warnings ?? []);
      setShowApolloContactsWizard(true);
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "Unable to enrich contacts from Apollo.");
    } finally {
      setApolloContactSyncing(false);
    }
  }

  function toggleApolloContactCandidate(dedupeKey: string) {
    setApolloContactCandidates((prev) =>
      prev.map((candidate) =>
        candidate.dedupeKey === dedupeKey && !candidate.alreadyExists
          ? { ...candidate, selected: !candidate.selected }
          : candidate
      )
    );
  }

  function closeApolloContactsWizard() {
    if (apolloBulkSaving) return;
    setShowApolloContactsWizard(false);
    setApolloContactCandidates([]);
    setApolloContactWarnings([]);
  }

  async function handleBulkCreateApolloContacts() {
    if (!client?.id) return;

    const selectedCandidates = apolloContactCandidates.filter((candidate) => candidate.selected && !candidate.alreadyExists);
    if (selectedCandidates.length === 0) {
      setContactError("Select at least one Apollo contact to add.");
      return;
    }

    setApolloBulkSaving(true);
    setContactError(null);

    try {
      const createdContacts = await bulkCreateContacts(
        client.id,
        selectedCandidates.map((candidate) => ({
          firstName: candidate.firstName.trim(),
          lastName: candidate.lastName.trim(),
          title: candidate.title.trim() || undefined,
          email: candidate.email.trim() || undefined,
          phone: candidate.phone.trim() || undefined,
          linkedIn: candidate.linkedIn.trim() || undefined,
          isPrimary: false,
        })),
        user?.repId ?? "unknown-rep"
      );

      const nextContacts = createdContacts.map((created) => ({
        id: created.id,
        firstName: created.firstName,
        lastName: created.lastName,
        title: created.title ?? "",
        email: created.email ?? "",
        phone: created.phone ?? "",
        linkedIn: created.linkedIn ?? "",
        isPrimary: created.isPrimary ?? false
      }));

      setContacts((prev) => [...prev, ...nextContacts]);
      showToast(`Added ${nextContacts.length} selected contact${nextContacts.length === 1 ? "" : "s"} from Apollo`);
      closeApolloContactsWizard();
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "Unable to add Apollo contacts.");
    } finally {
      setApolloBulkSaving(false);
    }
  }

  function handleEditContact(contact: Contact) {
    setContactError(null);
    setEditingContact({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      title: contact.title ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      linkedIn: contact.linkedIn ?? "",
      isPrimary: contact.isPrimary ?? false,
    });
  }

  async function handleSaveEditedContact() {
    if (!editingContact || !editingContact.firstName.trim()) {
      setContactError("First name is required.");
      return;
    }

    setEditContactSaving(true);
    setContactError(null);

    try {
      const updated = await updateContact(
        editingContact.id,
        {
          firstName: editingContact.firstName.trim(),
          lastName: editingContact.lastName.trim(),
          title: editingContact.title.trim() || undefined,
          email: editingContact.email.trim() || undefined,
          phone: editingContact.phone.trim() || undefined,
          linkedIn: editingContact.linkedIn.trim() || undefined,
          isPrimary: editingContact.isPrimary,
        },
        client?.id ?? "",
        user?.repId ?? "unknown-rep"
      );

      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === updated.id
            ? {
                ...contact,
                firstName: updated.firstName,
                lastName: updated.lastName,
                title: updated.title ?? "",
                email: updated.email ?? "",
                phone: updated.phone ?? "",
                linkedIn: updated.linkedIn ?? "",
                isPrimary: updated.isPrimary ?? false,
              }
            : updated.isPrimary
              ? { ...contact, isPrimary: false }
              : contact
        )
      );
      setEditingContact(null);
      showToast("Contact updated");
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "Unable to update contact.");
    } finally {
      setEditContactSaving(false);
    }
  }

  function requestDeleteContact(contact: Contact) {
    if (!contact.id || contact.id === "primary") {
      setContactError("This contact cannot be deleted from the profile.");
      return;
    }

    setContactError(null);
    setContactPendingDelete(contact);
  }

  async function handleDeleteContact(contact: Contact) {
    if (!contact.id || contact.id === "primary") {
      setContactError("This contact cannot be deleted from the profile.");
      return;
    }

    setDeletingContactId(contact.id);
    setContactError(null);

    try {
      await deleteContact(contact.id, client?.id ?? "", user?.repId ?? "unknown-rep");

      setContacts((prev) => prev.filter((entry) => entry.id !== contact.id));
      showToast("Contact removed");
      setContactPendingDelete(null);
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "Unable to delete contact.");
    } finally {
      setDeletingContactId(null);
    }
  }



  function getContactDetailHref(contact: Contact): string | null {
    if (contact.id && contact.id !== 'primary') {
      return `/contacts/${contact.id}?fromClientId=${client?.id ?? ""}&fromClientName=${encodeURIComponent(client?.companyName ?? "")}`;
    }

    const matchedContact = MOCK_CONTACTS.find(entry =>
      entry.email.toLowerCase() === contact.email.toLowerCase()
      || entry.linkedIn?.toLowerCase() === contact.linkedIn?.toLowerCase(),
    );

    if (!matchedContact) return null;

    return `/contacts/${matchedContact.id}?fromClientId=${client?.id ?? ""}&fromClientName=${encodeURIComponent(client?.companyName ?? "")}`;
  }

  if (clientLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Spinner className="mb-4 size-8 text-primary" />
          <p className="text-lg font-medium">Loading client...</p>
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Building2 className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Client not found.</p>
          <Link to={originHref} className="mt-4 text-primary hover:underline text-sm">Back to {originLabel}</Link>
        </div>
      </AppLayout>
    );
  }

  const repName = assignedRep ? `${assignedRep.firstName} ${assignedRep.lastName}` : "—";
  const hasExtended = false; // hippo replace
  const repInitials = assignedRep ? `${assignedRep.firstName[0]}${assignedRep.lastName[0]}` : "?";
  const clientContactEmails = Array.from(
    new Set(
      contacts
        .map((contact) => contact.email.trim().toLowerCase())
        .filter(Boolean)
    )
  );

  function handleStatusSave(newStatus: ClientStatus, reason?: string, notes?: string) {
    const prev = status;
    setStatus(newStatus);
    setShowStatusModal(false);
    if (newStatus === prev) return;
    let msg = `Status changed from ${prev} to ${newStatus}`;
    if (newStatus === "inactive" && reason) msg += ` — Reason: ${reason}`;
    if (newStatus === "inactive" && notes) {
      const note: Note = {
        id: `n${Date.now()}`,
        text: `[Inactivation note] ${notes}`,
        author: `${user?.firstName ?? "Unknown"} ${user?.lastName ?? "User"}`,
        timestamp: new Date().toISOString(),
      };
      // setNotes(prev => [note, ...prev]);
    }
    
  }

  async function handleProspectStatusSelect(nextStatus: Exclude<ProspectStatus, "inactive">) {
    if (!client?.id || nextStatus === prospectStatus || prospectStatusSaving) {
      setShowProspectStatusDropdown(false);
      return;
    }

    setProspectStatusSaving(true);
    try {
      let nextClientId = client.clientId ?? "";
      let nextChecklist = onboardingChecklist;

      if (nextStatus === 'closed') {
        const response = await updateClient(
          client.id,
          {
            prospectStatus: toProspectStatusEnum(nextStatus),
          },
          user?.repId ?? null,
          "Prospect status updated to closed"
        );
        logger.info("Updated prospect status to closed", { clientId: client.id });
        nextClientId = response.clientId ?? client.clientId ?? "";
        nextChecklist = response.onboardingChecklist ?? null;
      } else if (nextStatus === "onboarding") {
        const response = await updateClient(
          client.id,
          {
            prospectStatus: toProspectStatusEnum(nextStatus),
            createdClientDate: new Date()
          },
          user?.repId ?? null,
          "Prospect moved to onboarding"
        );
        logger.info("Moved prospect to onboarding", { clientId: client.id });
        nextClientId = response.clientId ?? client.clientId ?? "";
        nextChecklist = response.onboardingChecklist ?? null;
      }
      else {
        await updateClient(
          client.id,
          {
            prospectStatus: toProspectStatusEnum(nextStatus),
          },
          user?.repId ?? null,
          `Prospect status changed from ${client.prospectStatus} to ${nextStatus}`
        );
      }
      setDisplayClientId(nextClientId);
      setOnboardingChecklist(nextChecklist);
      setProspectStatus(nextStatus);
      setStatus(getDisplayStatus(client.clientStatus, nextStatus));
      setClient((current) => current ? {
        ...current,
        clientId: nextClientId || current.clientId,
        prospectStatus: nextStatus,
        onboardingChecklist: nextChecklist ?? current.onboardingChecklist,
      } : current);
      setShowProspectStatusDropdown(false);
      showToast(`Prospect status updated to ${formatLabel(nextStatus)}`);
    } catch (error) {
        logger.error("Failed to save prospect status", {
          clientId: client?.id,
          nextStatus,
          error
      });
      showToast(error instanceof Error ? error.message : "Unable to update prospect status.");
    } finally {
      logger.debug("Finished prospect status save attempt", {
        clientId: client?.id,
        nextStatus
      });
      setProspectStatusSaving(false);
    }
  }

  async function handleCreateTask(data: { taskType: TaskType; importance: Importance; dueDate: string; notes: string }) {
    if (!client || !user?.repId) return;

    try {
      const createdTask = await createTask({
        repId: user.repId,
        clientId: client.id,
        title: `${data.taskType} for ${client.companyName}`,
        description: data.notes,
        taskType: data.taskType,
        importance: data.importance,
        dueDate: data.dueDate,
      });

      setTasks((current) => [createdTask, ...current]);
      setShowAddTaskModal(false);
      showToast("Task added to Tasks");
    } catch (error) {
      logger.error("Failed to create task", {
        clientId: client.id,
        repId: user.repId,
        error
      });
      showToast(error instanceof Error ? error.message : "Unable to create task.");
    }
  }

  const statusCfg = STATUS_CONFIG[status];
  const StatusIcon = statusCfg.icon;
  const prospectStatusCfg = PROSPECT_STATUS_CONFIG[prospectStatus];
  const integrationName = client.metadata?.integration?.trim() ?? "";
  const integrationHealthStatus = !integrationName
    ? null
    : onboardingChecklist?.integration_setup
      ? "integrated"
      : prospectStatus === "onboarding"
        ? "in_progress"
        : "broken";
  const relatedTasks = client ? tasks.filter(task => task.associatedCompanyId === client.id) : [];

  async function toggleRelatedTask(id: string) {
    const existingTask = tasks.find((task) => task.id === id);
    if (!existingTask) return;

    const nextCompleted = !existingTask.completed;
    const previousTasks = tasks;

    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, completed: nextCompleted } : task))
    );

    try {
      const updated = await updateTask(id, { completed: nextCompleted });
      setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
    } catch (error) {
      logger.error("Failed to update client task", {
        clientId: client?.id,
        taskId: id,
        error
      });
      setTasks(previousTasks);
      showToast(error instanceof Error ? error.message : "Unable to update task.");
    }
  }

  const apolloStatusMessage = (() => {
    if (!apolloSnapshotEnabled) return "Turn on Apollo to load account insights here.";
    if (apolloLoading) return "Loading Apollo account data...";
    if (apolloError) return apolloError;
    if (!apolloSnapshot?.configured) return "Add your Apollo API key in the server env to load account insights here.";
    if (!apolloSnapshot.matchedAccount && !apolloSnapshot.organization) return "Apollo did not return a matching account for this client yet.";
    return null;
  })();
  const contactHealthEntries = apolloContactHealth?.contacts ?? [];
  const contactsMissingEmail = contactHealthEntries.filter((entry) => !entry.currentEmail).length;
  const contactsMissingPhone = contactHealthEntries.filter((entry) => !entry.currentPhone).length;
  const contactsMissingLinkedIn = contactHealthEntries.filter((entry) => !entry.currentLinkedIn).length;
  const enrichableFields = contactHealthEntries.reduce((total, entry) => total
    + (entry.canImproveEmail ? 1 : 0)
    + (entry.canImprovePhone ? 1 : 0)
    + (entry.canImproveLinkedIn ? 1 : 0), 0);

  return (
    <AppLayout>
      {showStatusModal && (
        <StatusModal
          current={status}
          onSave={handleStatusSave}
          onClose={() => setShowStatusModal(false)}
        />
      )}
      {showAddTaskModal && (
        <AddTaskModal
          companyName={client.companyName}
          onClose={() => setShowAddTaskModal(false)}
          onSave={handleCreateTask}
        />
      )}
      {showApolloContactsWizard && (
        <ApolloContactsWizard
          companyName={client.companyName}
          candidates={apolloContactCandidates}
          warnings={apolloContactWarnings}
          saving={apolloBulkSaving}
          error={contactError}
          onClose={closeApolloContactsWizard}
          onToggle={toggleApolloContactCandidate}
          onSave={handleBulkCreateApolloContacts}
        />
      )}
      {editingContact && (
        <EditContactModal
          contact={editingContact}
          saving={editContactSaving}
          onChange={setEditingContact}
          onClose={() => !editContactSaving && setEditingContact(null)}
          onSave={handleSaveEditedContact}
        />
      )}
      <EditClientInformationModal
        open={showClientInformationModal}
        form={clientInformationForm}
        saving={clientInformationSaving}
        onChange={setClientInformationForm}
        onOpenChange={(open) => {
          if (clientInformationSaving) return;
          setShowClientInformationModal(open);
          if (!open) {
            setClientInformationForm(createClientInformationForm(client));
          }
        }}
        onSave={handleSaveClientInformation}
      />
      {contactPendingDelete && (
        <DeleteContactConfirmModal
          contact={contactPendingDelete}
          deleting={deletingContactId === contactPendingDelete.id}
          onClose={() => !deletingContactId && setContactPendingDelete(null)}
          onConfirm={() => handleDeleteContact(contactPendingDelete)}
        />
      )}

      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to={originHref}>{originLabel}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{client.companyName}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── TOAST ────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#0f172a] text-white text-sm font-medium shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          {toast}
          <button onClick={() => setToast(null)} className="ml-2 text-white/50 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── STATUS + REP BAR ─────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">

        {/* Assigned Rep dropdown */}
        <div className="relative" ref={repDropdownRef}>
          <button
            onClick={() => !repPending && setShowRepDropdown(v => !v)}
            disabled={repPending}
            className={cn(
              "group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all shadow-sm",
              repPending
                ? "bg-amber-50 text-amber-700 border-amber-200 opacity-70 cursor-not-allowed"
                : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-muted/30 hover:shadow-md"
            )}
          >
            {/* Avatar */}
            <span className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
              repPending ? "bg-amber-200 text-amber-800" : "bg-primary/10 text-primary"
            )}>
              {repInitials}
            </span>
            <span className="max-w-[120px] truncate">{repName}</span>
            {repPending
              ? <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              : <ChevronDown className={cn("w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-all", showRepDropdown && "rotate-180")} />
            }
          </button>

          {/* Rep dropdown panel */}
          {showRepDropdown && (
            <div className="absolute left-0 top-full mt-2 z-40 w-60 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-3 py-2.5 border-b border-border/50 bg-muted/20">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reassign Rep</p>
              </div>
              <div className="max-h-64 overflow-y-auto py-1.5">
                {reps.filter(r => r.id !== assignedRep?.id).map(rep => {
                  const isCurrentRep = rep.id === assignedRep?.id;
                  return (
                    <button
                      key={rep.id}
                      onClick={() => handleRepSelect(rep)}
                      disabled={isCurrentRep}
                      className={cn(
                        "w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-left transition-colors",
                        isCurrentRep
                          ? "opacity-50 cursor-default"
                          : "hover:bg-primary/5 hover:text-primary"
                      )}
                    >
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {getInitials(rep.firstName,rep.lastName)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{rep.firstName} {rep.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{rep.title}</p>
                      </div>
                      {isCurrentRep && <Check className="w-3.5 h-3.5 ml-auto text-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Status button */}
        <button
          onClick={() => setShowStatusModal(true)}
          disabled={isPipelineStatus(client.clientStatus, client.prospectStatus)}
          className={cn(
            "group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all shadow-sm hover:shadow-md",
            statusCfg.badge,
            "hover:ring-2 hover:ring-offset-1",
            statusCfg.ring,
          )}
        >
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0 animate-pulse", statusCfg.dot)} />
          <StatusIcon className="w-3.5 h-3.5 flex-shrink-0" />
          {statusCfg.label}
          <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>

        {isPipelineStatus(status, prospectStatus) && (
          <div className="relative" ref={prospectStatusDropdownRef}>
            <button
              onClick={() => !prospectStatusSaving && setShowProspectStatusDropdown((value) => !value)}
              disabled={prospectStatusSaving}
              className={cn(
                "group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all shadow-sm hover:shadow-md",
                prospectStatusCfg.badge,
                prospectStatusSaving && "opacity-70 cursor-not-allowed"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", prospectStatusCfg.dot)} />
              <BriefcaseBusiness className="w-3.5 h-3.5 flex-shrink-0" />
              {formatLabel(prospectStatus)}
              {prospectStatusSaving
                ? <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                : <ChevronDown className={cn("w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-all", showProspectStatusDropdown && "rotate-180")} />
              }
            </button>

            {showProspectStatusDropdown && (
              <div className="absolute left-0 top-full mt-2 z-40 w-64 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-3 py-2.5 border-b border-border/50 bg-muted/20">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prospect Status</p>
                </div>
                <div className="py-1.5">
                  {PROSPECT_STATUS_OPTIONS.map((option) => {
                    const optionCfg = PROSPECT_STATUS_CONFIG[option];
                    const isSelected = option === prospectStatus;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => void handleProspectStatusSelect(option)}
                        disabled={prospectStatusSaving}
                        className={cn(
                          "w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-left transition-colors",
                          isSelected ? "bg-primary/5 text-primary" : "hover:bg-primary/5 hover:text-primary"
                        )}
                      >
                        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", optionCfg.dot)} />
                        <span className="flex-1 font-medium">{formatLabel(option)}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {repPending && (
          <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" /> Reassignment awaiting approval
          </span>
        )}
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">{client.companyName}</h1>
          <p className="text-muted-foreground mt-1 text-lg font-mono">{displayClientId || "Pending client ID assignment"}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {(companyWebsiteUrl || companyLinkedInUrl) && (
            <>
              {companyWebsiteUrl && (
                <a href={companyWebsiteUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/30 transition-all shadow-sm">
                  <Globe className="w-4 h-4 text-primary" />Website<ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              )}
              {companyLinkedInUrl && (
                <a href={companyLinkedInUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-[#0A66C2] hover:border-[#0A66C2]/30 hover:bg-blue-50/50 transition-all shadow-sm">
                  <LinkedInIcon className="w-4 h-4 text-[#0A66C2]" />LinkedIn<ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              )}
            </>
          )}
        </div>
        
      </div>

      <Tabs defaultValue="details" className="space-y-8">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-lg border border-border bg-card p-1 sm:w-auto">
          <TabsTrigger value="details" className="rounded-md px-4 py-2">Details</TabsTrigger>
          <TabsTrigger value="reporting" className="rounded-md px-4 py-2">Reporting</TabsTrigger>
          <TabsTrigger value="portfolio" className="rounded-md px-4 py-2">Portfolio</TabsTrigger>
          <TabsTrigger value="metrics" className="rounded-md px-4 py-2">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-0 space-y-8">
       

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {(prospectStatus === "onboarding" && onboardingChecklist && displayClientId) ? (
              <OnboardingWidget checklist={onboardingChecklist} clientId={displayClientId} />
            ) : (
              <ClientInformationWidget
                client={client}
                onEdit={() => {
                  setClientInformationForm(createClientInformationForm(client));
                  setShowClientInformationModal(true);
                }}
              />
            )}
            <IntegrationHealthWidget
              integration={client.metadata?.integration}
              status={integrationHealthStatus}
            />
          </div>
          
          {hasExtended && myClient && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6">
              <DetailCard icon={BarChart2} label="Total Placements" value={(myClient.totalPlacements ?? 0).toString()} color="text-amber-600" bg="bg-amber-100" />
              <DetailCard icon={BarChart2} label="Placements This Year" value={myClient.placementsThisYear.toLocaleString()} color="text-orange-600" bg="bg-orange-100" />
              <DetailCard icon={Percent} label="Recovery Rate" value={`${myClient.recoveryRate.toFixed(1)}%`} color="text-teal-600" bg="bg-teal-100" />
              <div className="min-w-0 bg-card rounded-xl p-3 border border-border shadow-sm flex items-center gap-2.5 hover-elevate sm:rounded-2xl sm:p-5 sm:gap-4 lg:p-6 lg:gap-5">
                <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0 sm:w-12 sm:h-12 sm:rounded-xl lg:w-14 lg:h-14 lg:rounded-2xl">
                  <Building2 className="w-4 h-4 text-sky-600 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground leading-tight sm:text-sm">Bucket</p>
                  <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mt-1 sm:w-10 sm:h-10 sm:text-lg", bucketColors[myClient.bucket] ?? "bg-muted text-muted-foreground")}>
                    {myClient.bucket}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* ── 1. CONTACTS (top) ───────────────────────────────────────── */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-4 border-b border-border/50 bg-muted/20 flex flex-col gap-3 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Points of Contact</h2>
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{contacts.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
              <button
                type="button"
                onClick={handleApolloContactEnrichment}
                disabled={apolloContactSyncing}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-primary/30 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed sm:py-1.5"
              >
                {apolloContactSyncing ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Enrich with Apollo
              </button>
              <button
                onClick={() => setShowAddContact(v => !v)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm sm:py-1.5"
              >
                {showAddContact ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                {showAddContact ? "Cancel" : "Add Contact"}
              </button>
            </div>
          </div>
          {contactError && !showAddContact && (
            <div className="px-6 py-3 border-b border-border/50 bg-destructive/5 text-sm text-destructive">
              {contactError}
            </div>
          )}

          {/* Add contact form */}
          {showAddContact && (
            <form onSubmit={handleAddContact} className="px-4 py-5 border-b border-border/50 bg-primary/5 sm:px-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">New Contact</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {[
                  { key: "firstName", placeholder: "First Name *", required: true },
                  { key: "lastName", placeholder: "Last Name *", required: true },
                  { key: "title", placeholder: "Job Title" },
                  { key: "email", placeholder: "Email Address", required:true },
                  { key: "phone", placeholder: "Phone Number" },
                  { key: "linkedIn", placeholder: "LinkedIn URL" },
                ].map(({ key, placeholder, required }) => (
                  <input
                    key={key}
                    type="text"
                    placeholder={placeholder}
                    required={required}
                    value={newContact[key as keyof typeof newContact]}
                    onChange={e => setNewContact(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                ))}
              </div>
              {contactError && (
                <p className="mb-4 text-sm text-destructive">{contactError}</p>
              )}
              <div className="flex justify-end">
                <button type="submit" disabled={contactSaving} className="inline-flex w-full items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:w-auto sm:py-2">
                  <Check className="w-4 h-4" /> {contactSaving ? "Saving..." : "Save Contact"}
                </button>
              </div>
            </form>
          )}

          

          {/* Contacts list */}
          <div className="divide-y divide-border/40">
            {contacts.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">No contacts yet — add one above.</p>
            )}
            {contacts.map(contact => {
              const contactHref = getContactDetailHref(contact);

              return (
                <div key={contact.id} className="px-4 py-5 flex flex-col gap-4 sm:px-6 lg:flex-row lg:items-start lg:gap-5">
                  {contactHref ? (
                    <Link
                      to={contactHref}
                      className="flex w-full items-start gap-3 min-w-0 rounded-2xl -m-2 p-2 hover:bg-primary/5 transition-colors sm:gap-5 lg:flex-1"
                    >
                      <div className="w-11 h-11 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {getInitials(contact.firstName,contact.lastName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="font-bold text-foreground hover:text-primary transition-colors">
                            {contact.firstName} {contact.lastName}
                          </p>
                          {contact.isPrimary && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">Primary</span>
                          )}
                        </div>
                        {contact.title && <p className="text-xs text-muted-foreground mb-3">{contact.title}</p>}
                      </div>
                    </Link>
                  ) : (
                    <>
                      <div className="w-11 h-11 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {getInitials(contact.firstName, contact.lastName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="font-bold text-foreground">{contact.firstName} {contact.lastName}</p>
                          {contact.isPrimary && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">Primary</span>
                          )}
                        </div>
                        {contact.title && <p className="text-xs text-muted-foreground mb-3">{contact.title}</p>}
                      </div>
                    </>
                  )}
                  <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:w-auto lg:flex-wrap lg:justify-end">
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="inline-flex min-w-0 items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-muted/20 text-xs font-medium text-foreground hover:text-primary hover:border-primary/30 transition-all lg:py-1.5">
                        <Phone className="w-3.5 h-3.5" />{contact.phone}
                      </a>
                    )}
                    {contact.email && <CopyableEmail email={contact.email} className="w-full lg:w-auto lg:max-w-72" />}
                    {contact.linkedIn && (
                      <a href={contact.linkedIn} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-muted/20 text-xs font-medium text-foreground hover:text-[#0A66C2] hover:border-[#0A66C2]/30 transition-all lg:py-1.5">
                        <LinkedInIcon className="w-3.5 h-3.5 text-[#0A66C2]" />LinkedIn
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    )}
                    {contact.id !== "primary" && (
                      <button
                        type="button"
                        onClick={() => handleEditContact(contact)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-muted/20 text-xs font-medium text-foreground hover:text-primary hover:border-primary/30 transition-all lg:py-1.5"
                      >
                        <Pencil className="w-3.5 h-3.5" />Edit
                      </button>
                    )}
                    {contact.id !== "primary" && (
                      <button
                        type="button"
                        onClick={() => requestDeleteContact(contact)}
                        disabled={deletingContactId === contact.id}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-700 hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed lg:py-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingContactId === contact.id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      
{!isProspectView &&
        <ClientMetadataWidget
          metadata={metadataForm}
          editing={metadataEditing}
          saving={metadataSaving}
          onEdit={() => setMetadataEditing(true)}
          onCancel={() => {
            setMetadataForm({
              ...DEFAULT_CLIENT_METADATA,
              ...(client.metadata ?? {}),
            });
            setMetadataEditing(false);
          }}
          onChange={updateMetadataForm}
          onSave={handleSaveMetadata}
        />}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ApolloAccountSnapshot
          snapshot={apolloSnapshot}
          statusMessage={apolloStatusMessage}
          enabled={apolloSnapshotEnabled}
          onToggle={handleApolloSnapshotToggle}
        />

        <ApolloContactHealthWidget
          health={apolloContactHealth}
          entries={contactHealthEntries}
          loading={apolloContactHealthLoading}
          error={apolloContactHealthError}
          enabled={apolloContactHealthEnabled}
          onToggle={handleApolloContactHealthToggle}
          contactsMissingEmail={contactsMissingEmail}
          contactsMissingPhone={contactsMissingPhone}
          contactsMissingLinkedIn={contactsMissingLinkedIn}
          enrichableFields={enrichableFields}
        />
</div>
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RelatedTasksWidget
          tasks={relatedTasks}
          isProspectView={isProspectView}
          onAddTask={() => setShowAddTaskModal(true)}
          onToggleTask={toggleRelatedTask}
        />
<NotesWidget />
        
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LinkedInUpdatesCard
          companyLinkedInUrl={companyLinkedInUrl}
          posts={linkedInPosts}
          emptyMessage={'Company page feed cannot be embedded directly from the company URL. Add three public post URLs or embed URLs for this company to render them here.'}
          openLabel="Open Company Page"
        />

        <OutlookEmailWidget
          emails={clientContactEmails}
          returnTo={outlookReturnTo}
          title="Outlook Emails"
          description={`Recent sent messages matched to the ${client.companyName} contact email list.`}
          emptyMessage="No recent sent Outlook emails matched this client's contact emails."
        />
        </div>

          {/* ── 6. NOTES + AUDIT LOG (side by side) ────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AccountHistoryWidget history={history} />
            <AuditLogWidget clientId={client.id} />
          </div>
        </TabsContent>

        <TabsContent value="reporting" className="mt-0">
          <div className="space-y-6">
            <ClientReportingStats client={client} />
            <ClientReportingTable client={client} />
          </div>
        </TabsContent>
        <TabsContent value="portfolio" className="mt-0">
          <ClientPortfolioHierarchy />
        </TabsContent>
        <TabsContent value="metrics" className="mt-0">
          <ClientPlacementMetricsWidget client={client} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
