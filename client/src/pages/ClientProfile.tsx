import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CLIENT_EXTRA_DETAILS } from "@/lib/mock-data";
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
} from "lucide-react";
import { DetailCard } from "@/components/shared/DetailCard";
import { LinkedInIcon, LinkedInUpdatesCard, type LinkedInPostItem } from "@/components/shared/LinkedInUpdatesCard";
import { cn } from "@/lib/utils";
import type { Client, UserProfile } from "@/types/api";
import { useTasks } from "@/context/TasksContext";
import type { Importance, TaskCompanyOrigin } from "@/lib/mock-data";
import { ClientStatus,TaskType } from "@/types/api";
import { MOCK_CONTACTS } from "@/data/mock_contacts";
import { formatLabel, getInitials } from "@/helpers/formatters";
import { useClients } from "@/context/ClientsContext";
import { useAuth } from "@/context/AuthContext";

const CONTACT_FIELDS = gql`
  fragment ContactFields on Contact {
    id
    firstName
    lastName
    title
    email
    phone
    linkedIn
    isPrimary
    clientIds
  }
`;

const CLIENT_CONTACTS_QUERY = gql`
  query ClientContacts($clientId: ID!) {
    contacts(clientId: $clientId) {
      ...ContactFields
    }
  }
  ${CONTACT_FIELDS}
`;

const CREATE_CONTACT_MUTATION = gql`
  mutation CreateContact($clientId: ID!, $input: CreateContactInput!) {
    createContact(clientId: $clientId, input: $input) {
      ...ContactFields
    }
  }
  ${CONTACT_FIELDS}
`;

const BULK_CREATE_CONTACTS_MUTATION = gql`
  mutation BulkCreateContacts($clientId: ID!, $inputs: [CreateContactInput!]!) {
    bulkCreateContacts(clientId: $clientId, inputs: $inputs) {
      ...ContactFields
    }
  }
  ${CONTACT_FIELDS}
`;

const UPDATE_CONTACT_MUTATION = gql`
  mutation UpdateContact($id: ID!, $input: UpdateContactInput!) {
    updateContact(id: $id, input: $input) {
      ...ContactFields
    }
  }
  ${CONTACT_FIELDS}
`;

const DELETE_CONTACT_MUTATION = gql`
  mutation DeleteContact($id: ID!) {
    deleteContact(id: $id) {
      ...ContactFields
    }
  }
  ${CONTACT_FIELDS}
`;

function formatMonthYear(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  return `${mins}m ago`;
}

function formatApolloContactName(contact: { firstName: string; lastName: string }) {
  return `${contact.firstName} ${contact.lastName}`.trim() || contact.firstName || "Unnamed contact";
}

function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1000000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000000 ? 1 : 0,
  }).format(value);
}

const bucketColors: Record<number, string> = {
  1: "bg-sky-100 text-sky-700 border border-sky-200",
  2: "bg-violet-100 text-violet-700 border border-violet-200",
  3: "bg-amber-100 text-amber-700 border border-amber-200",
};

type InactiveReason = "Moved to another company" | "Integration issues" | "Not a good fit" | "Other";

type Contact = { id: string; firstName: string; lastName: string; title: string; email: string; phone: string; linkedIn: string; isPrimary?: boolean };
type Note = { id: string; text: string; author: string; timestamp: string };
type AuditEntry = { id: string; action: string; author: string; timestamp: string; type: "info" | "add" | "edit" | "note" };
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
const STATUS_CONFIG: Record<ClientStatus, { label: string; icon: React.ElementType; badge: string; dot: string; ring: string }> = {
  active:      { label: "Active",      icon: Activity,  badge: "bg-emerald-100 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500", ring: "ring-emerald-300" },
  inactive:    { label: "Inactive",    icon: CircleOff, badge: "bg-red-100 text-red-700 border border-red-200",             dot: "bg-red-500",     ring: "ring-red-300"     },
  prospecting: { label: "Prospecting", icon: Search,    badge: "bg-amber-100 text-amber-700 border border-amber-200",       dot: "bg-amber-500",   ring: "ring-amber-300"   },
};

const INACTIVE_REASONS: InactiveReason[] = [
  "Moved to another company",
  "Integration issues",
  "Not a good fit",
  "Other",
];

const SEED_AUDIT: AuditEntry[] = [
  { id: "a1", action: "Client record created", author: "Tina Smith", timestamp: "2021-03-15T09:12:00Z", type: "add" },
  { id: "a2", action: "Unit count updated from 2,800 to 3,200", author: "Tina Smith", timestamp: "2022-06-10T14:22:00Z", type: "edit" },
  { id: "a3", action: "Assigned rep changed to Gordon Marshall", author: "Michael Scott", timestamp: "2023-01-08T10:45:00Z", type: "edit" },
  { id: "a4", action: "Last placement date updated to Nov 2025", author: "Gordon Marshall", timestamp: "2025-11-15T11:30:00Z", type: "edit" },
  { id: "a5", action: "Primary contact updated to Jennifer Walsh", author: "Gordon Marshall", timestamp: "2025-12-02T09:05:00Z", type: "edit" },
];

const SEED_NOTES: Note[] = [
  { id: "n1", text: "Client prefers morning calls — best time is 9–10 AM MT. Ask for Jennifer directly.", author: "Gordon Marshall", timestamp: "2026-01-14T09:30:00Z" },
  { id: "n2", text: "Q1 renewal discussion went well. They're looking to expand to two more properties in Q3.", author: "Gordon Marshall", timestamp: "2026-02-20T14:15:00Z" },
];

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


export default function ClientProfile() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { allClients, reps } = useClients();
  const { user } = useAuth();
  const from = searchParams.get("from");

  const fromMyClients = from === "my-clients";
  const fromPipeline = from === "pipeline";
  const originLabel = fromPipeline ? "Pipeline" : fromMyClients ? "My Clients" : "All Clients";
  const originHref = fromPipeline ? "/pipeline" : fromMyClients ? "/my-clients" : "/all-clients";

  const routeState = location.state as { prospect?: Client } | null;
  const client = allClients.find(c => c.id === id) ?? routeState?.prospect ?? null;
  const initialAssignedRep = reps.find(r => r.id === client?.assignedRepId) ?? null;

  const extra = id ? CLIENT_EXTRA_DETAILS[id] : undefined;
  const isProspectView = client?.status === 'prospecting';
  const { tasks, addTask, toggleTask } = useTasks();
  const extraLinks = extra as ({ website?: string; linkedIn?: string } | undefined);
  const companyWebsiteUrl = extraLinks?.website ?? client?.website ?? "";
  const companyLinkedInUrl = extraLinks?.linkedIn ?? extraLinks?.linkedIn ?? client?.linkedIn ?? "";
  const linkedInPosts = getLinkedInPosts(companyLinkedInUrl);
  const myClient = allClients.find(
    (entry) => entry.id === client?.id || entry.companyName === client?.companyName
  ) ?? null;
  const { data: contactsData } = useQuery<{ contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedIn?: string | null;
    isPrimary?: boolean | null;
  }> }>(CLIENT_CONTACTS_QUERY, {
    variables: {
      clientId: client?.id ?? ""
    },
    skip: !client?.id
  });
  const [createContactMutation] = useMutation<{
    createContact: {
      id: string;
      firstName: string;
      lastName: string;
      title?: string | null;
      email?: string | null;
      phone?: string | null;
      linkedIn?: string | null;
      isPrimary?: boolean | null;
    };
  }>(CREATE_CONTACT_MUTATION);
  const [bulkCreateContactsMutation] = useMutation<{
    bulkCreateContacts: Array<{
      id: string;
      firstName: string;
      lastName: string;
      title?: string | null;
      email?: string | null;
      phone?: string | null;
      linkedIn?: string | null;
      isPrimary?: boolean | null;
    }>;
  }>(BULK_CREATE_CONTACTS_MUTATION);
  const [updateContactMutation] = useMutation<{
    updateContact: {
      id: string;
      firstName: string;
      lastName: string;
      title?: string | null;
      email?: string | null;
      phone?: string | null;
      linkedIn?: string | null;
      isPrimary?: boolean | null;
    };
  }>(UPDATE_CONTACT_MUTATION);
  const [deleteContactMutation] = useMutation<{
    deleteContact: {
      id: string;
    };
  }>(DELETE_CONTACT_MUTATION);

  // Status state
  const [status, setStatus] = useState<ClientStatus>(isProspectView ? "prospecting" : "active");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [apolloSnapshot, setApolloSnapshot] = useState<ApolloSnapshotResponse | null>(null);
  const [apolloLoading, setApolloLoading] = useState(false);
  const [apolloError, setApolloError] = useState<string | null>(null);

  // Assigned rep state
  const [assignedRep, setAssignedRep] = useState(initialAssignedRep);
  const [repPending, setRepPending] = useState(false);
  const [showRepDropdown, setShowRepDropdown] = useState(false);
  const repDropdownRef = useRef<HTMLDivElement>(null);

  // Toast state
  const [toast, setToast] = useState<string | null>(null);

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

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function handleRepSelect(rep: UserProfile) {
    setAssignedRep(rep);
    setRepPending(true);
    setShowRepDropdown(false);
    addAudit(`Reassignment requested: ${rep.firstName} ${rep.lastName}`, "edit");
    showToast("Reassignment request sent — awaiting approval");
  }

  // Contacts state — seed from CLIENT_EXTRA_DETAILS
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

  // Notes state
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES);
  const [noteText, setNoteText] = useState("");

  // Account history state
  const [history] = useState<HistoryEntry[]>(SEED_HISTORY);

  // Audit log state
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(SEED_AUDIT);

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

    if (!extra) {
      setContacts([]);
      return;
    }

    setContacts([{
      id: "primary",
      firstName: extra.primaryContact.name.split(" ")[0] ?? "",
      lastName: extra.primaryContact.name.split(" ").slice(1).join(" "),
      title: extra.primaryContact.title,
      email: extra.primaryContact.email,
      phone: extra.primaryContact.phone,
      linkedIn: extra.primaryContact.linkedIn,
      isPrimary: true,
    }]);
  }, [contactsData, extra]);

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
        if (!controller.signal.aborted) {
          setApolloLoading(false);
        }
      });

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

  function addAudit(action: string, type: AuditEntry["type"] = "info") {
    setAuditLog(prev => [{
      id: `a${Date.now()}`,
      action,
      author: `${user?.firstName ?? "Unknown"} ${user?.lastName ?? "User"}`,
      timestamp: new Date().toISOString(),
      type,
    }, ...prev]);
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!newContact.firstName.trim() || !newContact.lastName.trim() || !client?.id) return;
    setContactSaving(true);
    setContactError(null);

    try {
      const response = await createContactMutation({
        variables: {
          clientId: client.id,
          input: {
            firstName: newContact.firstName.trim(),
            lastName: newContact.lastName.trim(),
            title: newContact.title.trim() || undefined,
            email: newContact.email.trim() || undefined,
            phone: newContact.phone.trim() || undefined,
            linkedIn: newContact.linkedIn.trim() || undefined,
            isPrimary: contacts.length === 0
          }
        }
      });

      const created = response.data?.createContact;
      if (!created) {
        throw new Error("Contact creation did not return a record.");
      }

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
      addAudit(`Added new contact: ${contact.firstName} ${contact.lastName}`, "add");
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
      const response = await bulkCreateContactsMutation({
        variables: {
          clientId: client.id,
          inputs: selectedCandidates.map((candidate) => ({
            firstName: candidate.firstName.trim(),
            lastName: candidate.lastName.trim(),
            title: candidate.title.trim() || undefined,
            email: candidate.email.trim() || undefined,
            phone: candidate.phone.trim() || undefined,
            linkedIn: candidate.linkedIn.trim() || undefined,
            isPrimary: false,
          }))
        }
      });

      const nextContacts = (response.data?.bulkCreateContacts ?? []).map((created) => ({
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
      addAudit(`Imported ${nextContacts.length} Apollo contact${nextContacts.length === 1 ? "" : "s"}`, "add");
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
      const response = await updateContactMutation({
        variables: {
          id: editingContact.id,
          input: {
            firstName: editingContact.firstName.trim(),
            lastName: editingContact.lastName.trim(),
            title: editingContact.title.trim() || undefined,
            email: editingContact.email.trim() || undefined,
            phone: editingContact.phone.trim() || undefined,
            linkedIn: editingContact.linkedIn.trim() || undefined,
            isPrimary: editingContact.isPrimary,
          }
        }
      });

      const updated = response.data?.updateContact;
      if (!updated) {
        throw new Error("Contact update did not return a record.");
      }

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
      addAudit(`Updated contact: ${updated.firstName} ${updated.lastName}`.trim(), "edit");
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
      await deleteContactMutation({
        variables: {
          id: contact.id
        }
      });

      setContacts((prev) => prev.filter((entry) => entry.id !== contact.id));
      addAudit(`Deleted contact: ${contact.firstName} ${contact.lastName}`.trim(), "edit");
      showToast("Contact removed");
      setContactPendingDelete(null);
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "Unable to delete contact.");
    } finally {
      setDeletingContactId(null);
    }
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    const note: Note = {
      id: `n${Date.now()}`,
      text: noteText.trim(),
      author: `${user?.firstName ?? "Unknown"} ${user?.lastName ?? "User"}`,
      timestamp: new Date().toISOString(),
    };
    setNotes(prev => [note, ...prev]);
    addAudit("Added a note", "note");
    setNoteText("");
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

  function handleStatusSave(newStatus: ClientStatus, reason?: string, notes?: string) {
    const prev = status;
    setStatus(newStatus);
    setShowStatusModal(false);
    if (newStatus === prev) return;
    let msg = `Status changed from ${prev} to ${newStatus}`;
    if (newStatus === "inactive" && reason) msg += ` — Reason: ${reason}`;
    addAudit(msg, "edit");
    if (newStatus === "inactive" && notes) {
      const note: Note = {
        id: `n${Date.now()}`,
        text: `[Inactivation note] ${notes}`,
        author: `${user?.firstName ?? "Unknown"} ${user?.lastName ?? "User"}`,
        timestamp: new Date().toISOString(),
      };
      setNotes(prev => [note, ...prev]);
    }
  }

  function handleCreateTask(data: { taskType: TaskType; importance: Importance; dueDate: string; notes: string }) {
    const associatedCompanyOrigin: TaskCompanyOrigin = fromPipeline
      ? "pipeline"
      : fromMyClients
        ? "my-clients"
        : "all-clients";

    addTask({
      ...data,
      associatedCompanyName: client.companyName,
      associatedCompanyId: client.id,
      associatedCompanyOrigin,
    });
    setShowAddTaskModal(false);
    showToast("Task added to Tasks");
  }

  const statusCfg = STATUS_CONFIG[status];
  const StatusIcon = statusCfg.icon;
  const relatedTasks = tasks.filter(task => task.associatedCompanyId === client.id);
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
          <p className="text-muted-foreground mt-1 text-lg font-mono">{client.clientId}</p>
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

        {/* ── 1. CONTACTS (top) ───────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Points of Contact</h2>
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{contacts.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApolloContactEnrichment}
                disabled={apolloContactSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {apolloContactSyncing ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Enrich with Apollo
              </button>
              <button
                onClick={() => setShowAddContact(v => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
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
            <form onSubmit={handleAddContact} className="px-6 py-5 border-b border-border/50 bg-primary/5">
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
                <button type="submit" disabled={contactSaving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <Check className="w-4 h-4" /> {contactSaving ? "Saving..." : "Save Contact"}
                </button>
              </div>
            </form>
          )}

          {/* Contacts list */}
          <div className="divide-y divide-border/40">
            {contacts.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">No contacts yet — add one above.</p>
            )}
            {contacts.map(contact => {
              const contactHref = getContactDetailHref(contact);

              return (
                <div key={contact.id} className="px-6 py-5 flex items-start gap-5">
                  {contactHref ? (
                    <Link
                      to={contactHref}
                      className="flex flex-1 items-start gap-5 min-w-0 rounded-2xl -m-2 p-2 hover:bg-primary/5 transition-colors"
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
                  <div className="flex flex-wrap gap-2">
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs font-medium text-foreground hover:text-primary hover:border-primary/30 transition-all">
                        <Phone className="w-3.5 h-3.5" />{contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs font-medium text-foreground hover:text-primary hover:border-primary/30 transition-all">
                        <Mail className="w-3.5 h-3.5" />{contact.email}
                      </a>
                    )}
                    {contact.linkedIn && (
                      <a href={contact.linkedIn} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs font-medium text-foreground hover:text-[#0A66C2] hover:border-[#0A66C2]/30 transition-all">
                        <LinkedInIcon className="w-3.5 h-3.5 text-[#0A66C2]" />LinkedIn
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    )}
                    {contact.id !== "primary" && (
                      <button
                        type="button"
                        onClick={() => handleEditContact(contact)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs font-medium text-foreground hover:text-primary hover:border-primary/30 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />Edit
                      </button>
                    )}
                    {contact.id !== "primary" && (
                      <button
                        type="button"
                        onClick={() => requestDeleteContact(contact)}
                        disabled={deletingContactId === contact.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-700 hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex items-center gap-5 hover-elevate">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bucket</p>
                  <span className={cn("inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold mt-1", bucketColors[myClient.bucket] ?? "bg-muted text-muted-foreground")}>
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
                  onClick={() => toggleTask(task.id)}
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
                      task.importance === "high" && "bg-red-100 text-red-700 border-red-200",
                      task.importance === "medium" && "bg-amber-100 text-amber-700 border-amber-200",
                      task.importance === "low" && "bg-slate-100 text-slate-500 border-slate-200",
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

        {/* ── 6. NOTES + AUDIT LOG (side by side) ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Notes */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Notes</h2>
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{notes.length}</span>
            </div>

            {/* Add note */}
            <form onSubmit={handleAddNote} className="px-5 py-4 border-b border-border/50 bg-muted/10">
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add a note about this client..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm resize-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!noteText.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Note
                </button>
              </div>
            </form>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/40 max-h-80">
              {notes.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">No notes yet.</p>
              )}
              {notes.map(note => (
                <div key={note.id} className="px-5 py-4">
                  <p className="text-sm text-foreground leading-relaxed mb-2">{note.text}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {note.author} · {timeAgo(note.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Log */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Audit Log</h2>
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{auditLog.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-96">
              {auditLog.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
              )}
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[2.35rem] top-0 bottom-0 w-px bg-border/60" />
                {auditLog.map(entry => (
                  <div key={entry.id} className="flex items-start gap-4 px-5 py-3.5 relative hover:bg-muted/20 transition-colors">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 border-2",
                      entry.type === "add"  && "bg-emerald-100 border-emerald-300 text-emerald-600",
                      entry.type === "edit" && "bg-amber-100 border-amber-300 text-amber-600",
                      entry.type === "note" && "bg-sky-100 border-sky-300 text-sky-600",
                      entry.type === "info" && "bg-slate-100 border-slate-300 text-slate-500",
                    )}>
                      {entry.type === "add"  && <Plus className="w-2.5 h-2.5" />}
                      {entry.type === "edit" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block" />}
                      {entry.type === "note" && <StickyNote className="w-2.5 h-2.5" />}
                      {entry.type === "info" && <span className="w-1.5 h-1.5 rounded-full bg-slate-400 block" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium leading-snug">{entry.action}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {entry.author} · {timeAgo(entry.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}



// ── Status Change Modal ──────────────────────────────────────────────────────

function StatusModal({
  current,
  onSave,
  onClose,
}: {
  current: ClientStatus;
  onSave: (status: ClientStatus, reason?: string, notes?: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<ClientStatus>(current);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const needsInactiveFields = selected === "inactive";
  const isValid = selected !== "inactive" || (reason.trim() !== "" && notes.trim() !== "");

  function handleSave() {
    if (!isValid) return;
    onSave(selected, reason || undefined, notes || undefined);
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div>
            <h2 className="text-lg font-bold text-foreground">Change Client Status</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Current: <span className={cn("font-semibold", STATUS_CONFIG[current].badge.split(" ")[1])}>{formatLabel(current)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Status radio options */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Status</p>
            {(["active", "inactive", "prospecting"] as ClientStatus[]).map(s => {
              const cfg = STATUS_CONFIG[s];
              const Icon = cfg.icon;
              const isChosen = selected === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSelected(s); if (s !== "inactive") { setReason(""); setNotes(""); } }}
                  className={cn(
                    "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-2 text-left transition-all",
                    isChosen
                      ? cn("border-primary bg-primary/5", cfg.badge.replace(/bg-\S+/, "").replace(/text-\S+/, "").replace(/border\s\S+/, "").trim())
                      : "border-border bg-muted/10 hover:border-border/80 hover:bg-muted/20"
                  )}
                >
                  {/* Radio dot */}
                  <div className={cn(
                    "w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    isChosen ? "border-primary bg-primary" : "border-muted-foreground/40 bg-background"
                  )}>
                    {isChosen && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                  </div>

                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                    cfg.badge.split(" ").slice(0, 1).join(" "), // bg only
                  )}>
                    <Icon className={cn("w-4 h-4", cfg.badge.split(" ").slice(1, 2).join(" "))} />
                  </div>

                  <div className="flex-1">
                    <p className={cn("font-semibold text-sm", isChosen ? "text-foreground" : "text-foreground")}>{formatLabel(s)}</p>
                    <p className="text-xs text-muted-foreground">
                      {s === "active" && "Client is actively engaged and placing"}
                      {s === "inactive" && "Client has stopped activity — requires reason"}
                      {s === "prospecting" && "Client is in early-stage outreach"}
                    </p>
                  </div>

                  {isChosen && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Inactive required fields */}
          {needsInactiveFields && (
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 space-y-3">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                <CircleOff className="w-3.5 h-3.5" /> Inactivation Details Required
              </p>

              {/* Reason dropdown */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Reason <span className="text-destructive">*</span>
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className={cn(
                    "w-full px-3.5 py-2.5 rounded-xl border-2 bg-background text-sm cursor-pointer focus:outline-none focus:ring-4 transition-all",
                    reason ? "border-border focus:border-primary focus:ring-primary/10" : "border-red-300 focus:border-red-400 focus:ring-red-100"
                  )}
                >
                  <option value="">Select a reason...</option>
                  {INACTIVE_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Notes textarea */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Notes <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Provide context for this status change..."
                  rows={3}
                  className={cn(
                    "w-full px-3.5 py-2.5 rounded-xl border-2 bg-background text-sm resize-none focus:outline-none focus:ring-4 transition-all",
                    notes.trim() ? "border-border focus:border-primary focus:ring-primary/10" : "border-red-300 focus:border-red-400 focus:ring-red-100"
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || selected === current}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Check className="w-4 h-4" />
            Save Status
          </button>
        </div>
      </div>
    </div>,
    document.body
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
  const [importance, setImportance] = useState<Importance>("medium");
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
              <select
                value={taskType}
                onChange={e => setTaskType(e.target.value as TaskType)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm cursor-pointer focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              >
                {(["Prospecting", "Follow-Up", "Training", "Other"] as TaskType[]).map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Criticality
              </label>
              <select
                value={importance}
                onChange={e => setImportance(e.target.value as Importance)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm cursor-pointer focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              >
                {(["high", "medium", "low"] as Importance[]).map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
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
