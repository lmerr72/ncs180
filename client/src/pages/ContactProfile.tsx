import { useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Building2, Mail, Phone, UserRound, StickyNote, ClipboardList, Clock, CalendarDays, PhoneCall } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LinkedInIcon, LinkedInUpdatesCard, type LinkedInPostItem } from "@/components/shared/LinkedInUpdatesCard";
import OutlookEmailWidget from "@/components/shared/OutlookEmailWidget";
import { MOCK_CONTACTS } from "@/data/mock_contacts";
import { cn, getAvatarColor } from "@/lib/utils";
import { getInitials } from "@/helpers/formatters";
import { CONTACT_QUERY, type ContactQueryData } from "@/services/contactService";
import { getClients } from "@/services/clientService";
import type { Client } from "@/types/api";

type LinkedInAuthStatus = {
  configured: boolean;
  connected: boolean;
  expiresAt: string | null;
  scope: string | null;
};

type LinkedInCompanyPostsResponse = {
  organization?: {
    id: string;
    name: string;
    vanityName: string;
    linkedInUrl: string;
  };
  posts: LinkedInPostItem[];
  error?: string;
};

type ContactNote = {
  id: string;
  text: string;
  author: string;
  timestamp: string;
};

type ContactHistoryEntryType = "meeting" | "email" | "call";
type ContactHistoryEntry = {
  id: string;
  type: ContactHistoryEntryType;
  subject: string;
  summary: string;
  actor: string;
  timestamp: string;
};

const MOCK_CONTACT_NOTES: ContactNote[] = [
  {
    id: "note-1",
    text: "Prefers email recaps after meetings and usually replies later in the afternoon.",
    author: "Gordon Marshall",
    timestamp: "2026-03-18T15:10:00Z"
  },
  {
    id: "note-2",
    text: "Interested in performance updates tied to occupancy and renewal cycles across the Denver portfolio.",
    author: "Gordon Marshall",
    timestamp: "2026-03-05T17:25:00Z"
  }
];

const MOCK_CONTACT_HISTORY: ContactHistoryEntry[] = [
  {
    id: "history-1",
    type: "meeting",
    subject: "Quarterly planning call",
    summary: "Reviewed staffing goals for the next leasing cycle and aligned on follow-up metrics.",
    actor: "Gordon Marshall",
    timestamp: "2026-03-21T16:00:00Z"
  },
  {
    id: "history-2",
    type: "email",
    subject: "Sent recap and action items",
    summary: "Shared the proposed rollout timeline, account recap, and next check-in date.",
    actor: "Gordon Marshall",
    timestamp: "2026-03-21T18:10:00Z"
  },
  {
    id: "history-3",
    type: "call",
    subject: "Inbound follow-up",
    summary: "Confirmed the team received the pricing deck and answered onboarding questions.",
    actor: "Jennifer Walsh",
    timestamp: "2026-03-14T19:30:00Z"
  }
];

const CONTACT_HISTORY_STYLES: Record<ContactHistoryEntryType, { icon: React.ElementType; badge: string; chip: string; label: string }> = {
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  return `${mins}m ago`;
}

export default function ContactProfile() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [linkedInStatus, setLinkedInStatus] = useState<LinkedInAuthStatus | null>(null);
  const [linkedInPosts, setLinkedInPosts] = useState<LinkedInPostItem[]>([]);
  const [linkedInError, setLinkedInError] = useState<string | null>(null);
  const [loadingLinkedIn, setLoadingLinkedIn] = useState(false);
  const { data } = useQuery<ContactQueryData>(CONTACT_QUERY, {
    variables: {
      id: id ?? ""
    },
    skip: !id
  });

  const backendContact = data?.contact
    ? {
        id: data.contact.id,
        firstName: data.contact.firstName,
        lastName: data.contact.lastName,
        title: data.contact.title ?? "",
        email: data.contact.email ?? "",
        phone: data.contact.phone ?? "",
        linkedIn: data.contact.linkedIn ?? "",
        is_primary: data.contact.isPrimary ?? false,
        clientIds: data.contact.clientIds
      }
    : null;
  const rawContact = backendContact ?? MOCK_CONTACTS.find(entry => entry.id === id);
  const contact = rawContact
    ? "firstName" in rawContact && "lastName" in rawContact
    ? rawContact
    : {
        ...rawContact,
        firstName: rawContact.name.split(" ")[0] ?? "",
        lastName: rawContact.name.split(" ").slice(1).join(" "),
      }
    : null;

  const relatedClients = allClients
    .filter(client => contact?.clientIds.includes(client.id))
    .sort((a, b) => a.companyName.localeCompare(b.companyName));
  const displayName = contact ? `${contact.firstName} ${contact.lastName}`.trim() : "";
  const relatedLinkedInCompany = relatedClients.find(client => client.linkedIn?.includes("linkedin.com/company/")) ?? null;
  const companyLinkedInUrl = relatedLinkedInCompany?.linkedIn ?? "";
  const linkedInReturnTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    params.delete("linkedin");
    params.delete("linkedin_error");
    const search = params.toString();
    return `${location.pathname}${search ? `?${search}` : ""}`;
  }, [location.pathname, location.search]);
  const outlookReturnTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    params.delete("outlook");
    params.delete("outlook_error");
    const search = params.toString();
    return `${location.pathname}${search ? `?${search}` : ""}`;
  }, [location.pathname, location.search]);
  const linkedInConnectUrl = `/api/linkedin/auth/start?returnTo=${encodeURIComponent(linkedInReturnTo)}`;

  const fromClientId = searchParams.get("fromClientId");
  const fromClientName = searchParams.get("fromClientName");
  const backHref = fromClientId ? `/clients/${fromClientId}` : "/clients";
  const backLabel = fromClientName ? fromClientName : "Clients";
  const initials = getInitials(contact?.firstName ?? "",contact?.lastName ?? "");
  const avatarColor = getAvatarColor(initials);
  const linkedInCallbackError = searchParams.get("linkedin_error");

  useEffect(() => {
    let ignore = false;

    async function loadClients() {
      const clients = await getClients();
      if (!ignore) {
        setAllClients(clients);
      }
    }

    void loadClients();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    fetch("/api/linkedin/auth/status", {
      credentials: "include",
    })
      .then(async response => {
        const payload = await response.json() as LinkedInAuthStatus & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to check LinkedIn connection status.");
        }
        if (!ignore) {
          setLinkedInStatus(payload);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setLinkedInStatus({
            configured: false,
            connected: false,
            expiresAt: null,
            scope: null,
          });
          setLinkedInError(error instanceof Error ? error.message : "Unable to check LinkedIn connection status.");
        }
      });

    return () => {
      ignore = true;
    };
  }, [linkedInCallbackError]);

  useEffect(() => {
    if (!contact?.id || !companyLinkedInUrl) {
      setLinkedInPosts([]);
      setLinkedInError(null);
      setLoadingLinkedIn(false);
      return;
    }

    if (!linkedInStatus?.configured || !linkedInStatus.connected) {
      setLinkedInPosts([]);
      setLoadingLinkedIn(false);
      return;
    }

    const controller = new AbortController();
    setLoadingLinkedIn(true);
    setLinkedInError(null);

    fetch(`/api/linkedin/company-posts?companyLinkedInUrl=${encodeURIComponent(companyLinkedInUrl)}&count=3`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async response => {
        const payload = await response.json() as LinkedInCompanyPostsResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to fetch LinkedIn company posts.");
        }

        setLinkedInPosts(payload.posts ?? []);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setLinkedInPosts([]);
        setLinkedInError(error instanceof Error ? error.message : "Unable to fetch LinkedIn company posts.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingLinkedIn(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [companyLinkedInUrl, contact?.id, linkedInStatus?.configured, linkedInStatus?.connected]);

  const linkedInStatusMessage = (() => {
    if (linkedInCallbackError) {
      return decodeURIComponent(linkedInCallbackError.replace(/\+/g, " "));
    }

    if (!companyLinkedInUrl) {
      return "This contact is not linked to a related company page with a LinkedIn company URL yet.";
    }

    if (!linkedInStatus) {
      return "Checking LinkedIn connection...";
    }

    if (!linkedInStatus.configured) {
      return "LinkedIn integration is not configured on the server yet.";
    }

    if (!linkedInStatus.connected) {
      return `Connect a LinkedIn admin account to load recent posts from ${relatedLinkedInCompany?.companyName ?? "the related company"}'s company page.`;
    }

    if (linkedInError) {
      return linkedInError;
    }

    return "No recent LinkedIn posts were returned for this company page.";
  })();

  if (!contact) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-2xl font-bold text-foreground">Contact not found</p>
          <Link to="/clients" className="text-primary hover:underline text-sm font-medium">
            Back to Clients
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        <Link
          to={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {backLabel}
        </Link>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="h-36 bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 relative">
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
            />
          </div>

          <div className="px-8 pb-6">
            <div className="-mt-14 mb-4 flex gap-5">
              <div
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center text-2xl font-display font-bold border-4 border-background shadow-xl flex-shrink-0",
                  avatarColor,
                )}
              >
                {initials}
              </div>
              <div className="pt-14">
                <h1 className="text-2xl font-display font-bold text-foreground leading-tight">
                  {displayName}
                </h1>
                <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-0.5">
                  <UserRound className="w-3.5 h-3.5 text-primary" />
                  {contact.title}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="bg-muted/30 rounded-xl p-4 border border-border/50 flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Email</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4 border border-border/50 flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Phone</p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors"
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4 border border-border/50 flex items-start gap-3 sm:col-span-2">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <LinkedInIcon className="w-4 h-4 text-[#0A66C2]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">LinkedIn</p>
                  <a
                    href={contact.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-foreground hover:text-[#0A66C2] hover:underline transition-colors break-all"
                  >
                    {contact.linkedIn}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <LinkedInUpdatesCard
          companyLinkedInUrl={companyLinkedInUrl}
          posts={linkedInPosts}
          loading={loadingLinkedIn}
          statusMessage={linkedInStatusMessage}
          actionHref={!linkedInStatus?.connected && linkedInStatus?.configured && companyLinkedInUrl ? linkedInConnectUrl : undefined}
          actionLabel="Connect LinkedIn"
          emptyMessage="No recent LinkedIn posts are available for this company page yet."
          openLabel="Open Company Page"
        />

        <OutlookEmailWidget
          emails={contact.email ? [contact.email] : []}
          returnTo={outlookReturnTo}
          title="Outlook Emails"
          description={`Recent sent messages matched to ${displayName || "this contact"}'s email address.`}
          emptyMessage="No recent sent Outlook emails matched this contact."
        />

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-border/50 bg-muted/20 px-6 py-4">
            <div>
              <h2 className="text-lg font-display font-bold text-foreground">Related Accounts</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Companies associated with {displayName}.
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/40">
            {relatedClients.length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No related accounts are linked to this contact yet.
              </div>
            )}

            {relatedClients.map(client => (
              <div key={client.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/clients/${client.id}`}
                      className="text-sm font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                    >
                      {client.companyName}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {client.unitCount.toLocaleString()} units
                    </p>
                  </div>
                </div>

                <span className="text-xs rounded-full border border-border bg-muted/40 px-2.5 py-1 font-semibold text-muted-foreground">
                  {contact.is_primary ? "Primary contact" : "Contact"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">History</h2>
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{MOCK_CONTACT_HISTORY.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-96">
              <div className="relative">
                <div className="absolute left-[2.35rem] top-0 bottom-0 w-px bg-border/60" />
                {MOCK_CONTACT_HISTORY.map((entry) => {
                  const config = CONTACT_HISTORY_STYLES[entry.type];
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

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Notes</h2>
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{MOCK_CONTACT_NOTES.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/40 max-h-96">
              {MOCK_CONTACT_NOTES.map((note) => (
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
        </div>
      </div>
    </AppLayout>
  );
}
