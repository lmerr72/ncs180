import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@apollo/client/react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ImportanceOptions, ProspectStatuses } from "@/types/constants";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Building2, MapPin, Hash, Users, BarChart2, TrendingUp, Percent,
  Globe, Phone, Mail, ExternalLink, UserPlus, X, Plus,
  StickyNote, ClipboardList, Clock, Check, ChevronDown,
  Activity, CircleOff, Search, CalendarDays, PhoneCall, Circle, CheckCircle2,
  BriefcaseBusiness, Sparkles, UserRound, Pencil, Trash2,
  Handshake,
} from "lucide-react";
import { DetailCard } from "@/components/shared/DetailCard";
import CustomSelect from "@/components/shared/CustomSelect";
import { LinkedInIcon, LinkedInUpdatesCard, type LinkedInPostItem } from "@/components/shared/LinkedInUpdatesCard";
import { createBrowserLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import type { AuditEntry, Client, Importance, Note, OnboardingChecklist, ProspectStatus, UserProfile } from "@/types/api";
import type { ExtendedTask } from "@/services/taskService";
import { ClientStatus,TaskType } from "@/types/api";
import { MOCK_CONTACTS } from "@/data/mock_contacts";
import { formatApolloContactName, formatCompactNumber, formatCurrency, formatLabel, formatMonthYear, getInitials, timeAgo } from "@/helpers/formatters";
import { useAuth } from "@/context/AuthContext";
import { OnboardingWidget } from "./OnboardingWidget";
import { STATUS_CONFIG } from "./constants";
import NotesWidget from "@/components/shared/NotesWidget";
import AuditLogWidget from "@/components/shared/AuditLogWidget";
import { CopyableEmail } from "@/components/shared/CopyableEmail";
import OutlookEmailWidget from "@/components/shared/OutlookEmailWidget";
import { StatusModal } from "./StatusModal";
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
type HistoryEntryType = "meeting" | "email" | "call";
type HistoryEntry = { id: string; type: HistoryEntryType; subject: string; summary: string; actor: string; timestamp: string };
type ApolloSnapshotResponse = {
  configured: boolean;
  matchedAccount: boolean;
  organization: {
    name: string;
    domain: string;
    website: string;
    industry: string;
    employeeCount: number | null;
    annualRevenue: number | null;
    location: string;
    keywords: string[];
  } | null;
  owner: {
    id: string;
    name: string;
    email: string;
    title: string;
  } | null;
  openDeals: Array<{
    id: string;
    name: string;
    stage: string;
    amount: number | null;
    closeDate: string | null;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    summary: string;
    at: string | null;
    actor: string;
  }>;
  warnings: string[];
  error?: string;
};
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
type ApolloContactHealthEntry = {
  firstName: string;
  lastName: string;
  title: string;
  currentEmail: string;
  currentPhone: string;
  currentLinkedIn: string;
  apolloEmail: string;
  apolloPhone: string;
  apolloLinkedIn: string;
  canImproveEmail: boolean;
  canImprovePhone: boolean;
  canImproveLinkedIn: boolean;
};
type ApolloContactHealthResponse = {
  configured: boolean;
  contacts: ApolloContactHealthEntry[];
  warnings: string[];
  error?: string;
};
type ApolloContactWizardCandidate = ApolloContactCandidate & {
  dedupeKey: string;
  selected: boolean;
  alreadyExists: boolean;
};
type EditableContactForm = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  linkedIn: string;
  isPrimary: boolean;
};

const PROSPECT_STATUS_CONFIG: Record<Exclude<ProspectStatus, "inactive">, { badge: string; dot: string }> = {
  not_started:      { badge: "bg-slate-100 text-slate-700 border border-slate-200",           dot: "bg-slate-500" },
  in_communication: { badge: "bg-sky-100 text-sky-700 border border-sky-200",                 dot: "bg-sky-500" },
  awaiting_review:  { badge: "bg-violet-100 text-violet-700 border border-violet-200",        dot: "bg-violet-500" },
  verbal:           { badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",     dot: "bg-emerald-500" },
  closed:           { badge: "bg-amber-100 text-amber-700 border border-amber-200",           dot: "bg-amber-500" },
};
const PROSPECT_STATUS_OPTIONS = ProspectStatuses as Exclude<ProspectStatus, "inactive">[];

const SEED_HISTORY: HistoryEntry[] = [
  { id: "h1", type: "meeting", subject: "Quarterly business review", summary: "Reviewed placement trends and expansion plans for two new properties.", actor: "Gordon Marshall", timestamp: "2026-03-12T15:00:00Z" },
  { id: "h2", type: "email", subject: "Follow-up proposal sent", summary: "Sent pricing recap and implementation timeline after the QBR.", actor: "Gordon Marshall", timestamp: "2026-03-12T18:20:00Z" },
  { id: "h3", type: "call", subject: "Operations check-in", summary: "Confirmed onboarding questions were resolved and next review is set for April.", actor: "Jennifer Walsh", timestamp: "2026-03-05T17:30:00Z" },
  { id: "h4", type: "email", subject: "Collections performance recap", summary: "Shared February recovery-rate summary with notes on underperforming sites.", actor: "Gordon Marshall", timestamp: "2026-02-28T16:10:00Z" },
];

const HISTORY_STYLES: Record<HistoryEntryType, { icon: React.ElementType; badge: string; chip: string; label: string }> = {
  meeting: {
    icon: CalendarDays,
    badge: "bg-blue-100 border-blue-300 text-blue-600",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    label: "Meeting",
  },
  email: {
    icon: Mail,
    badge: "bg-violet-100 border-violet-300 text-violet-600",
    chip: "bg-violet-50 text-violet-700 border-violet-200",
    label: "Email",
  },
  call: {
    icon: PhoneCall,
    badge: "bg-emerald-100 border-emerald-300 text-emerald-600",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Call",
  },
};

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
    case "closed":
    default:
      return "CLOSED";
  }
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
  const from = searchParams.get("from");

  const fromMyClients = from === "my-clients";
  const fromPipeline = from === "pipeline";
  const originLabel = fromPipeline ? "Pipeline" : fromMyClients ? "My Clients" : "All Clients";
  const originHref = fromPipeline ? "/pipeline" : fromMyClients ? "/my-clients" : "/all-clients";

  const routeState = location.state as { prospect?: Client } | null;
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
  const [status, setStatus] = useState<ClientStatus>(client?.clientStatus ?? "active"); // hippo replace default with laoder when client isnt ready
  const [displayClientId, setDisplayClientId] = useState(client?.clientId ?? "");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [prospectStatus, setProspectStatus] = useState<Exclude<ProspectStatus, "inactive">>(
    (client?.prospectStatus && client.prospectStatus !== "inactive" ? client.prospectStatus : "not_started")
  );
  const [onboardingChecklist, setOnboardingChecklist] = useState<OnboardingChecklist | null>(
    client?.onboardingChecklist ?? null
  );
  const [showProspectStatusDropdown, setShowProspectStatusDropdown] = useState(false);
  const [prospectStatusSaving, setProspectStatusSaving] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [apolloSnapshot, setApolloSnapshot] = useState<ApolloSnapshotResponse | null>(null);
  const [apolloLoading, setApolloLoading] = useState(false);
  const [apolloError, setApolloError] = useState<string | null>(null);

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
      const [clients, usersData, selectedClient] = await Promise.all([
        getClients(),
        getUsersContext(),
        id ? getClientById(id) : Promise.resolve(null),
      ]);

      if (ignore) return;

      setAllClients(clients);
      setReps(usersData.users);
      setClient(selectedClient ?? routeState?.prospect ?? null);
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, [id, routeState?.prospect]);

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
    setStatus(client?.clientStatus ?? "active");
  }, [client?.clientStatus]);

  useEffect(() => {
    setAssignedRep(reps.find((rep) => rep.id === client?.assignedRepId) ?? null);
  }, [client?.assignedRepId, reps]);

  const isProspectView = status === "prospecting";

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

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
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
  const [editingContact, setEditingContact] = useState<EditableContactForm | null>(null);
  const [editContactSaving, setEditContactSaving] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [contactPendingDelete, setContactPendingDelete] = useState<Contact | null>(null);

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

  useEffect(() => {
    if (!client?.companyName) {
      setApolloSnapshot(null);
      setApolloError(null);
      setApolloLoading(false);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      companyName: client.companyName,
    });

    if (companyWebsiteUrl) {
      params.set("website", companyWebsiteUrl);
    }

    setApolloLoading(true);
    setApolloError(null);

    // hippo commented out for now to not waste credits
    // fetch(`/api/apollo/account-snapshot?${params.toString()}`, {
    //   signal: controller.signal,
    // })
    //   .then(async (response) => {
    //     const payload = await response.json() as ApolloSnapshotResponse;
    //     if (!response.ok) {
    //       throw new Error(payload.error ?? "Unable to load Apollo account snapshot.");
    //     }

    //     setApolloSnapshot(payload);
    //   })
    //   .catch((error: unknown) => {
    //     if (controller.signal.aborted) {
    //       return;
    //     }

    //     setApolloSnapshot(null);
    //     setApolloError(error instanceof Error ? error.message : "Unable to load Apollo account snapshot.");
    //   })
    //   .finally(() => {
    //     if (!controller.signal.aborted) {
    //       setApolloLoading(false);
    //     }
    //   });

    return () => {
      controller.abort();
    };
  }, [client?.companyName, companyWebsiteUrl]);

  useEffect(() => {
    if (!client?.companyName || contacts.length === 0) {
      setApolloContactHealth(null);
      setApolloContactHealthError(null);
      setApolloContactHealthLoading(false);
      return;
    }

    const controller = new AbortController();
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
          linkedIn: contact.linkedIn
        }))
      })
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
        if (!controller.signal.aborted) {
          setApolloContactHealthLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [client?.companyName, companyWebsiteUrl, contacts]);

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
      if (nextStatus === 'closed') {
        const response = await updateClient(
          client.id,
          {
            prospectStatus: toProspectStatusEnum(nextStatus),
            clientStatus: "ONBOARDING",
            createdClientDate: new Date()
          },
          user?.repId ?? null,
          'Prospect closed and moved to onboarding status'
        );
        logger.info("Updated closed prospect to onboarding", { clientId: client.id });
        setOnboardingChecklist(response.onboardingChecklist ?? null);
        setStatus("onboarding");
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
      const previousStatus = prospectStatus;
      setProspectStatus(nextStatus);
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
          disabled={client.clientStatus === 'prospecting'}
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

        {status === "prospecting" && (
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

      <div className="space-y-8">
        {status === "onboarding" && onboardingChecklist && displayClientId && (
          <OnboardingWidget checklist={onboardingChecklist} clientId={displayClientId} />
        )}

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

        {/* ── 2. DETAIL STAT CARDS ───────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:gap-6">
          <DetailCard icon={MapPin} label="Headquarters" value={client.headquarters} color="text-blue-600" bg="bg-blue-100" />
          <DetailCard icon={Building2} label="Unit Count" value={client.unitCount.toLocaleString()} color="text-indigo-600" bg="bg-indigo-100" />
          {!isProspectView && (
            <DetailCard icon={Hash} label="Client ID" value={client.clientId} color="text-slate-600" bg="bg-slate-100" mono />
          )}
          {!isProspectView && (
            <DetailCard icon={TrendingUp} label="First Placement" value={formatMonthYear(client.firstPlacementDate)} color="text-violet-600" bg="bg-violet-100" />
          )}
          {!isProspectView && (
            <DetailCard icon={TrendingUp} label="Last Placement" value={formatMonthYear(client.lastPlacementDate)} color="text-pink-600" bg="bg-pink-100" />
          )}
          {hasExtended && myClient && (
            <>
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
            </>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Apollo Account Snapshot</h2>
            </div>
            {apolloSnapshot?.owner && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-background text-xs text-muted-foreground">
                <UserRound className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold text-foreground">{apolloSnapshot.owner.name}</span>
                {apolloSnapshot.owner.title && <span>{apolloSnapshot.owner.title}</span>}
              </div>
            )}
          </div>

          {apolloStatusMessage ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              {apolloStatusMessage}
            </div>
          ) : (
            <div className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Industry</p>
                  <p className="mt-2 text-lg font-display font-semibold text-foreground">
                    {apolloSnapshot?.organization?.industry || "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employees</p>
                  <p className="mt-2 text-lg font-display font-semibold text-foreground">
                    {formatCompactNumber(apolloSnapshot?.organization?.employeeCount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue</p>
                  <p className="mt-2 text-lg font-display font-semibold text-foreground">
                    {formatCurrency(apolloSnapshot?.organization?.annualRevenue)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">HQ / Domain</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {apolloSnapshot?.organization?.location || apolloSnapshot?.organization?.domain || "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50 bg-muted/20 flex items-center gap-2">
                    <BriefcaseBusiness className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Open Deals</h3>
                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                      {apolloSnapshot?.openDeals.length ?? 0}
                    </span>
                  </div>
                  <div className="divide-y divide-border/40">
                    {(apolloSnapshot?.openDeals.length ?? 0) === 0 && (
                      <p className="px-4 py-5 text-sm text-muted-foreground">Apollo did not return any open deals for this account.</p>
                    )}
                    {apolloSnapshot?.openDeals.map((deal) => (
                      <div key={deal.id} className="px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">{deal.name}</p>
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            {deal.stage}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatCurrency(deal.amount)}
                          {deal.closeDate ? ` · closes ${formatMonthYear(deal.closeDate)}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50 bg-muted/20 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Recent Activity</h3>
                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                      {apolloSnapshot?.recentActivity.length ?? 0}
                    </span>
                  </div>
                  <div className="divide-y divide-border/40">
                    {(apolloSnapshot?.recentActivity.length ?? 0) === 0 && (
                      <p className="px-4 py-5 text-sm text-muted-foreground">Apollo did not return recent activity for this account.</p>
                    )}
                    {apolloSnapshot?.recentActivity.map((entry) => (
                      <div key={entry.id} className="px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                          <span className="inline-flex items-center rounded-full border border-border bg-muted/20 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                            {entry.type}
                          </span>
                        </div>
                        {entry.summary && (
                          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{entry.summary}</p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {entry.actor ? `${entry.actor} · ` : ""}
                          {entry.at ? timeAgo(entry.at) : "Timestamp unavailable"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {(apolloSnapshot?.organization?.keywords.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2">
                  {apolloSnapshot?.organization?.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}

              {(apolloSnapshot?.warnings.length ?? 0) > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {apolloSnapshot?.warnings.join(" ")}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Contact Health</h2>
          </div>

          {apolloContactHealthLoading ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">Checking Apollo contact coverage...</div>
          ) : apolloContactHealthError ? (
            <div className="px-6 py-8 text-sm text-destructive">{apolloContactHealthError}</div>
          ) : (
            <div className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Missing Email</p>
                  <p className="mt-2 text-lg font-display font-semibold text-foreground">{contactsMissingEmail}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Missing Phone</p>
                  <p className="mt-2 text-lg font-display font-semibold text-foreground">{contactsMissingPhone}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Missing LinkedIn</p>
                  <p className="mt-2 text-lg font-display font-semibold text-foreground">{contactsMissingLinkedIn}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Apollo Fill Opportunities</p>
                  <p className="mt-2 text-lg font-display font-semibold text-foreground">{enrichableFields}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Coverage By Contact</h3>
                </div>
                <div className="divide-y divide-border/40">
                  {contactHealthEntries.length === 0 && (
                    <p className="px-4 py-5 text-sm text-muted-foreground">No contacts are available to score yet.</p>
                  )}
                  {contactHealthEntries.map((entry) => (
                    <div key={`${entry.firstName}-${entry.lastName}-${entry.title}`} className="px-4 py-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{entry.firstName} {entry.lastName}</p>
                          {entry.title && <p className="text-xs text-muted-foreground mt-1">{entry.title}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold",
                            entry.currentEmail ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                          )}>
                            {entry.currentEmail ? "Email on file" : entry.canImproveEmail ? "Apollo can add email" : "Missing email"}
                          </span>
                          <span className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold",
                            entry.currentPhone ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                          )}>
                            {entry.currentPhone ? "Phone on file" : entry.canImprovePhone ? "Apollo can add phone" : "Missing phone"}
                          </span>
                          <span className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold",
                            entry.currentLinkedIn ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                          )}>
                            {entry.currentLinkedIn ? "LinkedIn on file" : entry.canImproveLinkedIn ? "Apollo can add LinkedIn" : "Missing LinkedIn"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(apolloContactHealth?.warnings.length ?? 0) > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {apolloContactHealth?.warnings.join(" ")}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 3. TASKS ───────────────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Tasks</h2>
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{relatedTasks.length}</span>
            </div>
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </button>
          </div>

          <div className="divide-y divide-border/40">
            {relatedTasks.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                No tasks for this {isProspectView ? "prospect" : "client"} yet.
              </p>
            )}
            {relatedTasks.map(task => (
              <div key={task.id} className="px-6 py-4 flex items-start gap-4 hover:bg-muted/20 transition-colors">
                <button
                  onClick={() => toggleRelatedTask(task.id)}
                  className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                >
                  {task.completed
                    ? <CheckCircle2 className="w-5 h-5 text-primary" />
                    : <Circle className="w-5 h-5" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-violet-100 text-violet-700 border-violet-200">
                      {task.taskType}
                    </span>
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize",
                      task.importance === "HIGH" && "bg-red-100 text-red-700 border-red-200",
                      task.importance === "MEDIUM" && "bg-amber-100 text-amber-700 border-amber-200",
                      task.importance === "LOW" && "bg-slate-100 text-slate-500 border-slate-200",
                    )}>
                      {task.importance}
                    </span>
                    {task.commType === "email" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-blue-50 text-blue-600 border-blue-200">
                        <Mail className="w-3 h-3" />
                        Email
                      </span>
                    )}
                    {task.commType === "phone" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-200">
                        <Phone className="w-3 h-3" />
                        Phone
                      </span>
                    )}
                    <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {task.dueDate}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm font-semibold leading-snug",
                    task.completed ? "text-muted-foreground line-through" : "text-foreground",
                  )}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    {task.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. ACCOUNT HISTORY ─────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">History</h2>
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{history.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-96">
            {history.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">No meetings, emails, or calls recorded yet.</p>
            )}
            <div className="relative">
              <div className="absolute left-[2.35rem] top-0 bottom-0 w-px bg-border/60" />
              {history.map(entry => {
                const config = HISTORY_STYLES[entry.type];
                const Icon = config.icon;

                return (
                  <div key={entry.id} className="flex items-start gap-4 px-5 py-4 relative hover:bg-muted/20 transition-colors">
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 border-2", config.badge)}>
                      <Icon className="w-2.5 h-2.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <p className="text-sm text-foreground font-medium leading-snug">{entry.subject}</p>
                        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", config.chip)}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{entry.summary}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                        <Clock className="w-3 h-3" />
                        {entry.actor} · {timeAgo(entry.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 5. LINKEDIN UPDATES ────────────────────────────────────── */}
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

        {/* ── 6. NOTES + AUDIT LOG (side by side) ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NotesWidget />
          <AuditLogWidget clientId={client.id} />
        </div>
      </div>
    </AppLayout>
  );
}

function ApolloContactsWizard({
  companyName,
  candidates,
  warnings,
  saving,
  error,
  onClose,
  onToggle,
  onSave,
}: {
  companyName: string;
  candidates: ApolloContactWizardCandidate[];
  warnings: string[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onToggle: (dedupeKey: string) => void;
  onSave: () => void;
}) {
  const selectedCount = candidates.filter((candidate) => candidate.selected && !candidate.alreadyExists).length;

  return createPortal(
    <div className="fixed inset-0 z-[205] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-12 px-4" onClick={onClose}>
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div>
            <h2 className="text-lg font-bold text-foreground">Apollo Contact Matches</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {warnings.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {warnings.join(" ")}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Apollo did not return any contacts to review.</p>
          ) : (
            <div className="space-y-3">
              {candidates.map((candidate) => (
                <button
                  key={candidate.dedupeKey}
                  type="button"
                  onClick={() => onToggle(candidate.dedupeKey)}
                  disabled={candidate.alreadyExists}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition-all",
                    candidate.alreadyExists
                      ? "border-border bg-muted/20 opacity-70 cursor-not-allowed"
                      : candidate.selected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border",
                      candidate.selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-transparent",
                      candidate.alreadyExists && "border-border bg-muted text-muted-foreground"
                    )}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">
                          {formatApolloContactName(candidate)}
                        </p>
                        {candidate.alreadyExists && (
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                            Already added
                          </span>
                        )}
                        {!candidate.alreadyExists && candidate.selected && (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                            Selected
                          </span>
                        )}
                        <span className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          candidate.emailStatus === "enriched" && "border-blue-200 bg-blue-50 text-blue-700",
                          candidate.emailStatus === "available" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                          (!candidate.emailStatus || candidate.emailStatus === "missing") && "border-amber-200 bg-amber-50 text-amber-700"
                        )}>
                          {candidate.emailStatus === "enriched"
                            ? "Email enriched"
                            : candidate.emailStatus === "available"
                              ? "Has email"
                              : "No email"}
                        </span>
                      </div>
                      {candidate.title && (
                        <p className="mt-1 text-sm text-muted-foreground">{candidate.title}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {candidate.email && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-3 py-1.5 text-xs font-medium text-foreground">
                            <Mail className="w-3.5 h-3.5" />{candidate.email}
                          </span>
                        )}
                        {candidate.phone && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-3 py-1.5 text-xs font-medium text-foreground">
                            <Phone className="w-3.5 h-3.5" />{candidate.phone}
                          </span>
                        )}
                        {candidate.linkedIn && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-3 py-1.5 text-xs font-medium text-foreground">
                            <LinkedInIcon className="w-3.5 h-3.5 text-[#0A66C2]" />LinkedIn
                          </span>
                        )}
                        {(candidate.city || candidate.state) && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-3 py-1.5 text-xs font-medium text-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            {[candidate.city, candidate.state].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
          <p className="text-sm text-muted-foreground">{selectedCount} selected</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || selectedCount === 0}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Adding..." : "Add selected"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function EditContactModal({
  contact,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  contact: EditableContactForm;
  saving: boolean;
  onChange: (contact: EditableContactForm) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const isValid = contact.firstName.trim().length > 0;

  function setField(field: keyof EditableContactForm, value: string | boolean) {
    onChange({
      ...contact,
      [field]: value,
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div>
            <h2 className="text-lg font-bold text-foreground">Edit Contact</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{formatApolloContactName(contact)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name *"
              value={contact.firstName}
              onChange={(e) => setField("firstName", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={contact.lastName}
              onChange={(e) => setField("lastName", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Job Title"
              value={contact.title}
              onChange={(e) => setField("title", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={contact.email}
              onChange={(e) => setField("email", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Phone Number"
              value={contact.phone}
              onChange={(e) => setField("phone", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
            <input
              type="text"
              placeholder="LinkedIn URL"
              value={contact.linkedIn}
              onChange={(e) => setField("linkedIn", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={contact.isPrimary}
              onChange={(e) => setField("isPrimary", e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Set as primary contact
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!isValid || saving}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function DeleteContactConfirmModal({
  contact,
  deleting,
  onClose,
  onConfirm,
}: {
  contact: Contact;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <h2 className="text-lg font-bold text-foreground">Delete Contact?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Remove <span className="font-semibold text-foreground">{formatApolloContactName(contact)}</span> from this client profile?
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            This will delete the contact record and remove it from the client’s points of contact list.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Delete contact"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AddTaskModal({
  companyName,
  onSave,
  onClose,
}: {
  companyName: string;
  onSave: (data: { taskType: TaskType; importance: Importance; dueDate: string; notes: string }) => void;
  onClose: () => void;
}) {
  const [taskType, setTaskType] = useState<TaskType>("Follow-Up");
  const [importance, setImportance] = useState<Importance>("MEDIUM");
  const [dueDate, setDueDate] = useState<string>(() => {
    const today = new Date();
    return new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");

  const isValid = dueDate.trim() !== "" && notes.trim() !== "";

  function handleSave() {
    if (!isValid) return;
    onSave({
      taskType,
      importance,
      dueDate,
      notes: notes.trim(),
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div>
            <h2 className="text-lg font-bold text-foreground">Create Task</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Task Type
              </label>
              <CustomSelect
                value={taskType}
                onChange={value => setTaskType(value as TaskType)}
                options={(["Prospecting", "Follow-Up", "Training", "Other"] as TaskType[]).map((option) => ({
                  value: option,
                  label: option,
                }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Criticality
              </label>
              <CustomSelect
                value={importance}
                onChange={value => setImportance(value as Importance)}
                options={ImportanceOptions.map((option) => ({
                  value: option,
                  label: option,
                }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add context for the task..."
              rows={5}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm resize-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
