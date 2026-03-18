import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { MOCK_ALL_CLIENTS, MOCK_MY_CLIENTS, CLIENT_EXTRA_DETAILS, MOCK_USER, MOCK_REPS } from "@/lib/mock-data";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Building2, MapPin, Hash, Users, BarChart2, TrendingUp, Percent,
  Globe, Phone, Mail, ExternalLink, UserPlus, X, Plus,
  StickyNote, ClipboardList, Clock, Check, ChevronDown,
  Activity, CircleOff, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

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

const bucketColors: Record<number, string> = {
  1: "bg-sky-100 text-sky-700 border border-sky-200",
  2: "bg-violet-100 text-violet-700 border border-violet-200",
  3: "bg-amber-100 text-amber-700 border border-amber-200",
};

type ClientStatus = "Active" | "Inactive" | "Prospecting";
type InactiveReason = "Moved to another company" | "Integration issues" | "Not a good fit" | "Other";

type Contact = { id: string; name: string; title: string; email: string; phone: string; linkedin: string; isPrimary?: boolean };
type Note = { id: string; text: string; author: string; timestamp: string };
type AuditEntry = { id: string; action: string; author: string; timestamp: string; type: "info" | "add" | "edit" | "note" };

const STATUS_CONFIG: Record<ClientStatus, { label: string; icon: React.ElementType; badge: string; dot: string; ring: string }> = {
  Active:      { label: "Active",      icon: Activity,  badge: "bg-emerald-100 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500", ring: "ring-emerald-300" },
  Inactive:    { label: "Inactive",    icon: CircleOff, badge: "bg-red-100 text-red-700 border border-red-200",             dot: "bg-red-500",     ring: "ring-red-300"     },
  Prospecting: { label: "Prospecting", icon: Search,    badge: "bg-amber-100 text-amber-700 border border-amber-200",       dot: "bg-amber-500",   ring: "ring-amber-300"   },
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

export default function ClientProfile() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");

  const fromMyClients = from === "my-clients";
  const originLabel = fromMyClients ? "My Clients" : "All Clients";
  const originHref = fromMyClients ? "/my-clients" : "/all-clients";

  const allClient = MOCK_ALL_CLIENTS.find(c => c.id === id);
  const myClient = MOCK_MY_CLIENTS.find(c => c.id === id);
  const client = myClient ?? allClient;
  const extra = id ? CLIENT_EXTRA_DETAILS[id] : undefined;

  // Status state
  const [status, setStatus] = useState<ClientStatus>("Active");
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Assigned rep state
  const [assignedRep, setAssignedRep] = useState(client?.assignedRep ?? null);
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

  function handleRepSelect(rep: typeof MOCK_REPS[0]) {
    setAssignedRep(rep);
    setRepPending(true);
    setShowRepDropdown(false);
    addAudit(`Reassignment requested: ${rep.firstName} ${rep.lastName}`, "edit");
    showToast("Reassignment request sent — awaiting approval");
  }

  // Contacts state — seed from CLIENT_EXTRA_DETAILS
  const [contacts, setContacts] = useState<Contact[]>(() => {
    if (!extra) return [];
    return [{
      id: "primary",
      name: extra.primaryContact.name,
      title: extra.primaryContact.title,
      email: extra.primaryContact.email,
      phone: extra.primaryContact.phone,
      linkedin: extra.primaryContact.linkedin,
      isPrimary: true,
    }];
  });
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", title: "", email: "", phone: "", linkedin: "" });

  // Notes state
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES);
  const [noteText, setNoteText] = useState("");

  // Audit log state
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(SEED_AUDIT);

  function addAudit(action: string, type: AuditEntry["type"] = "info") {
    setAuditLog(prev => [{
      id: `a${Date.now()}`,
      action,
      author: `${MOCK_USER.firstName} ${MOCK_USER.lastName}`,
      timestamp: new Date().toISOString(),
      type,
    }, ...prev]);
  }

  function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!newContact.name.trim()) return;
    const contact: Contact = { id: `c${Date.now()}`, ...newContact };
    setContacts(prev => [...prev, contact]);
    addAudit(`Added new contact: ${newContact.name}`, "add");
    setNewContact({ name: "", title: "", email: "", phone: "", linkedin: "" });
    setShowAddContact(false);
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    const note: Note = {
      id: `n${Date.now()}`,
      text: noteText.trim(),
      author: `${MOCK_USER.firstName} ${MOCK_USER.lastName}`,
      timestamp: new Date().toISOString(),
    };
    setNotes(prev => [note, ...prev]);
    addAudit("Added a note", "note");
    setNoteText("");
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
  const hasExtended = !!myClient;
  const repInitials = assignedRep ? `${assignedRep.firstName[0]}${assignedRep.lastName[0]}` : "?";

  function handleStatusSave(newStatus: ClientStatus, reason?: string, notes?: string) {
    const prev = status;
    setStatus(newStatus);
    setShowStatusModal(false);
    if (newStatus === prev) return;
    let msg = `Status changed from ${prev} to ${newStatus}`;
    if (newStatus === "Inactive" && reason) msg += ` — Reason: ${reason}`;
    addAudit(msg, "edit");
    if (newStatus === "Inactive" && notes) {
      const note: Note = {
        id: `n${Date.now()}`,
        text: `[Inactivation note] ${notes}`,
        author: `${MOCK_USER.firstName} ${MOCK_USER.lastName}`,
        timestamp: new Date().toISOString(),
      };
      setNotes(prev => [note, ...prev]);
    }
  }

  const statusCfg = STATUS_CONFIG[status];
  const StatusIcon = statusCfg.icon;

  return (
    <AppLayout>
      {showStatusModal && (
        <StatusModal
          current={status}
          onSave={handleStatusSave}
          onClose={() => setShowStatusModal(false)}
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
                {MOCK_REPS.filter(r => r.id !== "u3").map(rep => {
                  const isCurrentRep = rep.id === assignedRep?.id;
                  const initials = `${rep.firstName[0]}${rep.lastName[0]}`;
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
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{rep.firstName} {rep.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{rep.role}</p>
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
        {extra && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={extra.website} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/30 transition-all shadow-sm">
              <Globe className="w-4 h-4 text-primary" />Website<ExternalLink className="w-3 h-3 opacity-50" />
            </a>
            <a href={extra.linkedin} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-[#0A66C2] hover:border-[#0A66C2]/30 hover:bg-blue-50/50 transition-all shadow-sm">
              <LinkedInIcon className="w-4 h-4 text-[#0A66C2]" />LinkedIn<ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          </div>
        )}
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
            <button
              onClick={() => setShowAddContact(v => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              {showAddContact ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              {showAddContact ? "Cancel" : "Add Contact"}
            </button>
          </div>

          {/* Add contact form */}
          {showAddContact && (
            <form onSubmit={handleAddContact} className="px-6 py-5 border-b border-border/50 bg-primary/5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">New Contact</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {[
                  { key: "name", placeholder: "Full Name *", required: true },
                  { key: "title", placeholder: "Job Title" },
                  { key: "email", placeholder: "Email Address" },
                  { key: "phone", placeholder: "Phone Number" },
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
                <input
                  type="text"
                  placeholder="LinkedIn URL"
                  value={newContact.linkedin}
                  onChange={e => setNewContact(prev => ({ ...prev, linkedin: e.target.value }))}
                  className="w-full sm:col-span-2 px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                  <Check className="w-4 h-4" /> Save Contact
                </button>
              </div>
            </form>
          )}

          {/* Contacts list */}
          <div className="divide-y divide-border/40">
            {contacts.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">No contacts yet — add one above.</p>
            )}
            {contacts.map(contact => (
              <div key={contact.id} className="px-6 py-5 flex items-start gap-5">
                <div className="w-11 h-11 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-bold text-foreground">{contact.name}</p>
                    {contact.isPrimary && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">Primary</span>
                    )}
                  </div>
                  {contact.title && <p className="text-xs text-muted-foreground mb-3">{contact.title}</p>}
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
                    {contact.linkedin && (
                      <a href={contact.linkedin} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs font-medium text-foreground hover:text-[#0A66C2] hover:border-[#0A66C2]/30 transition-all">
                        <LinkedInIcon className="w-3.5 h-3.5 text-[#0A66C2]" />LinkedIn
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. DETAIL STAT CARDS ───────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DetailCard icon={MapPin} label="Headquarters" value={client.headquarters} color="text-blue-600" bg="bg-blue-100" />
          <DetailCard icon={Building2} label="Unit Count" value={client.unitCount.toLocaleString()} color="text-indigo-600" bg="bg-indigo-100" />
          <DetailCard icon={Hash} label="Client ID" value={client.clientId} color="text-slate-600" bg="bg-slate-100" mono />
          <DetailCard icon={TrendingUp} label="First Placement" value={formatMonthYear(client.firstPlacementDate)} color="text-violet-600" bg="bg-violet-100" />
          <DetailCard icon={TrendingUp} label="Last Placement" value={formatMonthYear(client.lastPlacementDate)} color="text-pink-600" bg="bg-pink-100" />
          {hasExtended && myClient && (
            <>
              <DetailCard icon={BarChart2} label="Total Placements" value={myClient.totalPlacements.toLocaleString()} color="text-amber-600" bg="bg-amber-100" />
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

        {/* ── 3. NOTES + AUDIT LOG (side by side) ────────────────────── */}
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

function DetailCard({ icon: Icon, label, value, color, bg, mono }: {
  icon: React.ElementType; label: string; value: string; color: string; bg: string; mono?: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex items-center gap-5 hover-elevate">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0", bg)}>
        <Icon className={cn("w-7 h-7", color)} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className={cn("text-xl font-display font-bold text-foreground mt-0.5 truncate", mono && "font-mono text-base")}>{value}</p>
      </div>
    </div>
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

  const needsInactiveFields = selected === "Inactive";
  const isValid = selected !== "Inactive" || (reason.trim() !== "" && notes.trim() !== "");

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
              Current: <span className={cn("font-semibold", STATUS_CONFIG[current].badge.split(" ")[1])}>{current}</span>
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
            {(["Active", "Inactive", "Prospecting"] as ClientStatus[]).map(s => {
              const cfg = STATUS_CONFIG[s];
              const Icon = cfg.icon;
              const isChosen = selected === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSelected(s); if (s !== "Inactive") { setReason(""); setNotes(""); } }}
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
                    <p className={cn("font-semibold text-sm", isChosen ? "text-foreground" : "text-foreground")}>{s}</p>
                    <p className="text-xs text-muted-foreground">
                      {s === "Active" && "Client is actively engaged and placing"}
                      {s === "Inactive" && "Client has stopped activity — requires reason"}
                      {s === "Prospecting" && "Client is in early-stage outreach"}
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
