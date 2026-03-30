import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Building2, Mail, Phone, UserRound } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LinkedInIcon, LinkedInUpdatesCard, type LinkedInPostItem } from "@/components/shared/LinkedInUpdatesCard";
import { useClients } from "@/context/ClientsContext";
import { MOCK_CONTACTS } from "@/data/mock_contacts";
import { cn, getAvatarColor } from "@/lib/utils";
import { getInitials } from "@/helpers/formatters";

const CONTACT_QUERY = gql`
  query Contact($id: ID!) {
    contact(id: $id) {
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
  }
`;

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

export default function ContactProfile() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { allClients } = useClients();
  const [linkedInStatus, setLinkedInStatus] = useState<LinkedInAuthStatus | null>(null);
  const [linkedInPosts, setLinkedInPosts] = useState<LinkedInPostItem[]>([]);
  const [linkedInError, setLinkedInError] = useState<string | null>(null);
  const [loadingLinkedIn, setLoadingLinkedIn] = useState(false);
  const { data } = useQuery<{ contact: {
    id: string;
    firstName: string;
    lastName: string;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedIn?: string | null;
    isPrimary?: boolean | null;
    clientIds: string[];
  } | null }>(CONTACT_QUERY, {
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
  const linkedInConnectUrl = `/api/linkedin/auth/start?returnTo=${encodeURIComponent(linkedInReturnTo)}`;

  const fromClientId = searchParams.get("fromClientId");
  const fromClientName = searchParams.get("fromClientName");
  const backHref = fromClientId ? `/clients/${fromClientId}` : "/all-clients";
  const backLabel = fromClientName ? fromClientName : "All Clients";
  const initials = getInitials(contact?.firstName ?? "",contact?.lastName ?? "");
  const avatarColor = getAvatarColor(initials);
  const linkedInCallbackError = searchParams.get("linkedin_error");

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
    if (!contact || !companyLinkedInUrl) {
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
  }, [companyLinkedInUrl, contact, linkedInStatus]);

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
          <Link to="/all-clients" className="text-primary hover:underline text-sm font-medium">
            Back to All Clients
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
      </div>
    </AppLayout>
  );
}
