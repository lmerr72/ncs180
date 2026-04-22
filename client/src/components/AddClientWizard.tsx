import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, Wand2, Check, Building2, AlertTriangle, Search, TrendingUp } from "lucide-react";
import CustomSelect from "@/components/shared/CustomSelect";
import { ModalContainer } from "@/components/shared/ModalContainer";
import { cn } from "@/lib/utils";
import {
  MOCK_USER, STATE_TERRITORIES, REP_KEY_TO_ID, REP_DETAILS, type ProspectStatus,
} from "@/lib/mock-data";
import { US_STATES } from "@/types/constants";
import { getInitials } from "@/helpers/formatters";
import { useAuth } from "@/context/AuthContext";
import { createClient, createProspect, getClients } from "@/services/clientService";
import { getUsersContext } from "@/services/userService";
import type { Client, UserProfile } from "@/types/api";

export interface SeedResult {
  website: string | null;
  linkedIn?: string | null;
  linkedin?: string | null;
  dbas: string;
  city: string | null;
  state: string | null;
  unitCount: string | null;
  confidence?: {
    label: "high" | "medium" | "low";
    score: number;
  };
  filledFields?: string[];
  searchHits?: Array<{
    title: string;
    url: string;
    domain?: string;
  }>;
  usedQueries?: string[];
  usedLocationHints?: {
    city: string | null;
    state: string | null;
  };
  warnings?: string[];
  error?: string;
}

interface Props {
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}

type WizardMode = "client" | "prospect";
type Step = 1 | 2;
const UNASSIGNED_REP_ID = "__unassigned__";

interface FormData {
  companyName: string;
  dbas: string;
  website: string;
  linkedIn: string;
  city: string;
  state: string;
  unitCount: string;
  assignedRepId: string;
  prospectStatus: ProspectStatus;
}

const EMPTY: FormData = {
  companyName: "",
  dbas: "",
  website: "",
  linkedIn: "",
  city: "",
  state: "",
  unitCount: "",
  assignedRepId: "",
  prospectStatus: "Not Started",
};

const ALL_STATUSES: ProspectStatus[] = ["Not Started", "In Communication", "Awaiting Review", "Verbal", "Onboarding", "Closed"];

const STATUS_STYLES: Record<ProspectStatus, { badge: string; dot: string }> = {
  Verbal: { badge: "bg-sky-100 text-sky-700 border-sky-200", dot: "bg-sky-400" },
  "In Communication": { badge: "bg-teal-100 text-teal-700 border-teal-200", dot: "bg-teal-400" },
  "Awaiting Review": { badge: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  "Not Started": { badge: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-400" },
  Onboarding: { badge: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-400" },
  Closed: { badge: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-400" },
};

interface CompanyTypeaheadProps {
  value: string;
  onChange: (val: string) => void;
  companyNames: string[];
  mode: WizardMode;
}

function CompanyTypeahead({ value, onChange, companyNames, mode }: CompanyTypeaheadProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = value.trim().toLowerCase();
  const entityLabel = mode === "client" ? "client" : "prospect";
  const suggestions = trimmed.length >= 1
    ? companyNames.filter((name) => name.toLowerCase().includes(trimmed)).slice(0, 7)
    : [];
  const exactMatch = companyNames.find((name) => name.toLowerCase() === trimmed);
  const hasSuggestions = suggestions.length > 0 && open && !exactMatch;
  const showNoMatch = trimmed.length >= 2 && open && suggestions.length === 0 && !exactMatch;

  function handleCreateNewSelection() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          autoComplete="off"
          placeholder="e.g. Synergy Properties"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;

            if (exactMatch) {
              event.preventDefault();
              return;
            }

            if (mode === "prospect" && showNoMatch) {
              event.preventDefault();
              handleCreateNewSelection();
            }
          }}
          className={cn(
            inputCls,
            "pl-9",
            exactMatch && "border-amber-400 focus:border-amber-500 focus:ring-amber-100"
          )}
        />
      </div>

      {hasSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-10 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border/50 bg-muted/20">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Existing companies</p>
          </div>
          {suggestions.map((name) => {
            const idx = name.toLowerCase().indexOf(trimmed);
            const before = name.slice(0, idx);
            const match = name.slice(idx, idx + trimmed.length);
            const after = name.slice(idx + trimmed.length);

            return (
              <button
                key={name}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-primary/5 hover:text-primary transition-colors group"
              >
                <Building2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                <span>
                  {before}
                  <span className="font-bold text-primary">{match}</span>
                  {after}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {showNoMatch && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-10 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleCreateNewSelection}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-primary/5 transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <Building2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs mb-0.5">No match found</p>
              <p className="font-semibold text-foreground">
                Create new {entityLabel}: <span className="text-primary">"{value.trim()}"</span>
              </p>
            </div>
          </button>
        </div>
      )}

      {exactMatch && (
        <div className="mt-2 flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">Possible duplicate</p>
            <p className="text-xs text-amber-700 mt-0.5">
              <span className="font-semibold">"{exactMatch}"</span> already exists in the system.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function SeedInsightCard({ seed }: { seed: SeedResult | null }) {
  if (!seed || (!seed.searchHits?.length && !seed.filledFields?.length && !seed.confidence)) {
    return null;
  }

  const confidenceTone = seed.confidence?.label === "high"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : seed.confidence?.label === "medium"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seed Insights</p>
          <p className="text-sm text-foreground">Review what the agent found before saving.</p>
        </div>
        {seed.confidence && (
          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold capitalize", confidenceTone)}>
            {seed.confidence.label} confidence
          </span>
        )}
      </div>

      {!!seed.filledFields?.length && (
        <div className="flex flex-wrap gap-2">
          {seed.filledFields.map((field) => (
            <span key={field} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {field}
            </span>
          ))}
        </div>
      )}

      {!!seed.searchHits?.length && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Sources</p>
          <div className="space-y-2">
            {seed.searchHits.slice(0, 3).map((hit) => (
              <a
                key={hit.url}
                href={hit.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-border bg-background px-3 py-2 hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <p className="text-sm font-medium text-foreground line-clamp-1">{hit.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{hit.domain || hit.url}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {!!seed.usedQueries?.length && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Search Terms Used</p>
          <div className="flex flex-wrap gap-2">
            {seed.usedQueries.slice(0, 4).map((query) => (
              <span key={query} className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                {query}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function toProspectStatusValue(
  status: ProspectStatus
): "VERBAL" | "IN_COMMUNICATION" | "AWAITING_REVIEW" | "ONBOARDING" | "CLOSED" | "NOT_STARTED" {
  switch (status) {
    case "Verbal":
      return "VERBAL";
    case "In Communication":
      return "IN_COMMUNICATION";
    case "Awaiting Review":
      return "AWAITING_REVIEW";
    case "Onboarding":
      return "ONBOARDING";
    case "Closed":
      return "CLOSED";
    case "Not Started":
    default:
      return "NOT_STARTED";
  }
}

function SharedClientWizard({ onClose, onSuccess, mode }: Props & { mode: WizardMode }) {
  const { user: currentUser } = useAuth();
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [reps, setReps] = useState<UserProfile[]>([]);
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [seedDetails, setSeedDetails] = useState<SeedResult | null>(null);

  const isClientMode = mode === "client";
  const title = isClientMode ? "Add New Client" : "Create Prospect";
  const successTitle = isClientMode ? "Client Added!" : "Prospect Created!";
  const icon = isClientMode
    ? <Building2 className="w-4 h-4 text-primary" />
    : <TrendingUp className="w-4 h-4 text-primary" />;
  const defaultProspectRepId = currentUser?.repId ?? MOCK_USER.id;

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      const [clients, usersData] = await Promise.all([
        getClients(),
        getUsersContext(),
      ]);

      if (!ignore) {
        setAllClients(clients);
        setReps(usersData.users);
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isClientMode && !form.assignedRepId) {
      setForm((prev) => ({ ...prev, assignedRepId: defaultProspectRepId }));
    }
  }, [defaultProspectRepId, form.assignedRepId, isClientMode]);

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSeed() {
    const name = form.companyName.trim();
    if (name.length < 2) return;

    setSeeding(true);
    setSeedError(null);
    setSeedSuccess(false);

    try {
      const response = await fetch("/api/apollo/seed-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: name,
          website: form.website.trim(),
        }),
      });
      const data = await response.json() as SeedResult;
      if (!response.ok) throw new Error(data.error ?? `Server error ${response.status}`);

      setForm((prev) => ({
        ...prev,
        website: data.website ?? prev.website,
        linkedIn: data.linkedIn ?? data.linkedin ?? prev.linkedIn,
        dbas: data.dbas || prev.dbas,
        city: data.city ?? prev.city,
        state: data.state ?? prev.state,
        unitCount: data.unitCount ?? prev.unitCount,
      }));
      setSeedDetails(data);
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (error) {
      setSeedError(error instanceof Error ? error.message : "Couldn't fetch company data. Try again.");
    } finally {
      setSeeding(false);
    }
  }

  const repKey = STATE_TERRITORIES[form.state];
  const isOpenTerritory = !form.state || repKey === "open" || !repKey;
  const autoRepId = repKey && repKey !== "open" ? REP_KEY_TO_ID[repKey] : null;
  const companyNames = allClients.map((client) => client.companyName);
  const isUnassignedSelection = form.assignedRepId === UNASSIGNED_REP_ID;
  const selectedRep = reps.find((rep) => rep.id === form.assignedRepId) ?? null;
  const step1Valid = Boolean(form.companyName.trim() && form.city.trim() && form.state);
  const step2Valid = Boolean(form.assignedRepId);
  const statusStyle = STATUS_STYLES[form.prospectStatus];

  function handleAutoAssign() {
    if (autoRepId) set("assignedRepId", autoRepId);
  }

  async function handleSubmit() {
    setSaving(true);
    setSaveError(null);
    const auditRepId = currentUser?.repId ?? MOCK_USER.id;

    try {
      if (isClientMode) {
        await createClient({
          companyName: form.companyName.trim(),
          dbas: form.dbas.split(",").map((value) => value.trim()).filter(Boolean),
          website: form.website.trim() || undefined,
          linkedIn: form.linkedIn.trim() || undefined,
          isCorporate: false,
          address: {
            city: form.city.trim(),
            state: form.state,
          },
          unitCount: parseInt(form.unitCount, 10) || 0,
          contactIds: [],
          assignedRepId: isUnassignedSelection ? undefined : (selectedRep?.id ?? undefined),
        });
      } else {
        await createProspect({
          companyName: form.companyName.trim(),
          dbas: form.dbas.split(",").map((value) => value.trim()).filter(Boolean),
          website: form.website.trim() || undefined,
          linkedIn: form.linkedIn.trim() || undefined,
          isCorporate: false,
          address: {
            city: form.city.trim(),
            state: form.state,
          },
          unitCount: parseInt(form.unitCount, 10) || 0,
          contactIds: [],
          assignedRepId: auditRepId,
          prospectStatus: toProspectStatusValue(form.prospectStatus),
        });
      }

      await onSuccess?.();
      setSubmitted(true);
    } catch (error) {
      setSaveError(error instanceof Error
        ? error.message
        : isClientMode
          ? "Unable to save client."
          : "Unable to create prospect.");
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <WizardOverlay onClose={onClose} title={title} icon={icon}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">{successTitle}</h2>
          <p className="text-muted-foreground text-sm mb-1">
            <span className="font-semibold text-foreground">{form.companyName}</span>
            {isClientMode ? " has been added to Clients." : " has been added to your Pipeline."}
          </p>
          {isClientMode && selectedRep?.id === (currentUser?.repId ?? MOCK_USER.id) && (
            <p className="text-xs text-emerald-600 font-medium mb-6">Also visible in your My Clients page.</p>
          )}
          {!isClientMode && (
            <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mt-2 mb-6", statusStyle.badge)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", statusStyle.dot)} />
              {form.prospectStatus}
            </div>
          )}
          {isClientMode && selectedRep?.id !== (currentUser?.repId ?? MOCK_USER.id) && <div className="mb-6" />}
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </WizardOverlay>
    );
  }

  return (
    <WizardOverlay onClose={onClose} title={title} icon={icon}>
      {isClientMode && (
        <div className="flex items-center gap-2 mb-6">
          {([1, 2] as Step[]).map((currentStep) => (
            <div key={currentStep} className="flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                step === currentStep
                  ? "bg-primary border-primary text-primary-foreground"
                  : currentStep < step
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-muted border-border text-muted-foreground"
              )}>
                {currentStep < step ? <Check className="w-3.5 h-3.5" /> : currentStep}
              </div>
              <span className={cn("text-xs font-medium", step === currentStep ? "text-foreground" : "text-muted-foreground")}>
                {currentStep === 1 ? "Company Info" : "Assignment"}
              </span>
              {currentStep < 2 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 ml-1" />}
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Field label="Company Name" required>
            <CompanyTypeahead
              value={form.companyName}
              onChange={(value) => {
                set("companyName", value);
                setSeedError(null);
                setSeedSuccess(false);
                setSeedDetails(null);
              }}
              companyNames={companyNames}
              mode={mode}
            />
          </Field>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={form.companyName.trim().length < 2 || seeding}
              onClick={handleSeed}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all",
                form.companyName.trim().length < 2
                  ? "border-border text-muted-foreground bg-muted/30 cursor-not-allowed opacity-50"
                  : seedSuccess
                    ? "border-emerald-400 text-emerald-700 bg-emerald-50"
                    : "border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary"
              )}
            >
              {seeding ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>Searching…</span>
                </>
              ) : seedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Fields filled!</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Enrich with Apollo</span>
                </>
              )}
            </button>
            {seedError && (
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {seedError}
              </span>
            )}
            {!seedError && !seeding && !seedSuccess && form.companyName.trim().length >= 2 && (
              <span className="text-xs text-muted-foreground">Auto-fill fields using Apollo account data</span>
            )}
          </div>

          <SeedInsightCard seed={seedDetails} />

          {!isClientMode && (
            <Field label="Prospect Status" required>
              <div className="grid grid-cols-2 gap-2">
                {ALL_STATUSES.map((status) => {
                  const style = STATUS_STYLES[status];
                  const active = form.prospectStatus === status;

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => set("prospectStatus", status)}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-2 text-sm font-semibold text-left transition-all",
                        active
                          ? cn(style.badge, "border-current ring-2 ring-offset-1 ring-current/30")
                          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      )}
                    >
                      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", active ? style.dot : "bg-muted-foreground/30")} />
                      {status}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          <Field label="DBAs" hint="Also known as — separate multiple with commas">
            <input
              type="text"
              placeholder="e.g. Synergy Realty, Synergy Living"
              value={form.dbas}
              onChange={(event) => set("dbas", event.target.value)}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Website">
              <input
                type="text"
                placeholder="https://..."
                value={form.website}
                onChange={(event) => set("website", event.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="LinkedIn URL">
              <input
                type="text"
                placeholder="https://linkedin.com/company/..."
                value={form.linkedIn}
                onChange={(event) => set("linkedIn", event.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="City" required>
              <input
                type="text"
                placeholder="e.g. Denver"
                value={form.city}
                onChange={(event) => set("city", event.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="State" required>
              <CustomSelect
                value={form.state}
                onChange={(value) => set("state", value)}
                placeholder="Select state..."
                options={US_STATES.map((state) => ({ value: state, label: state }))}
                className="min-h-0"
              />
            </Field>
          </div>

          <Field label="Unit Count">
            <input
              type="number"
              min={0}
              placeholder="e.g. 2500"
              value={form.unitCount}
              onChange={(event) => set("unitCount", event.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {isClientMode && step === 2 && (
        <div className="space-y-5">
          {form.state && (
            <div className={cn(
              "rounded-xl px-4 py-3 text-sm flex items-center gap-2.5 border",
              isOpenTerritory
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            )}>
              <Building2 className="w-4 h-4 flex-shrink-0" />
              {isOpenTerritory
                ? <span><strong>{form.state}</strong> is an open territory - auto-assign is not available.</span>
                : <span><strong>{form.state}</strong> is assigned to <strong>{autoRepId ? `${REP_DETAILS[autoRepId]?.firstName} ${REP_DETAILS[autoRepId]?.lastName}` : "a rep"}</strong>.</span>}
            </div>
          )}

          <Field label="Assigned Rep" required>
            <div className="flex gap-2">
              <CustomSelect
                value={form.assignedRepId}
                onChange={(value) => set("assignedRepId", value)}
                placeholder="Select a rep..."
                options={[
                  { value: UNASSIGNED_REP_ID, label: "Unassigned" },
                  ...reps.map((rep) => ({
                    value: rep.id,
                    label: `${rep.firstName} ${rep.lastName}`,
                  })),
                ]}
                className="min-h-0 flex-1"
              />
              <button
                type="button"
                onClick={handleAutoAssign}
                disabled={isOpenTerritory}
                title={isOpenTerritory ? "Open territory - no rep assigned" : "Auto-assign based on territory"}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all",
                  isOpenTerritory
                    ? "bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50"
                    : "bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <Wand2 className="w-3.5 h-3.5" />
                Auto Assign Rep
              </button>
            </div>
          </Field>

          {isUnassignedSelection && (
            <div className="rounded-xl border border-border bg-muted/20 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted border-2 border-border flex items-center justify-center text-muted-foreground font-bold text-sm flex-shrink-0">
                --
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Unassigned</p>
                <p className="text-xs text-muted-foreground">
                  This client will be created without an assigned sales rep.
                </p>
              </div>
            </div>
          )}

          {selectedRep && (
            <div className="rounded-xl border border-border bg-muted/20 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {getInitials(selectedRep.firstName, selectedRep.lastName)}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{selectedRep.firstName} {selectedRep.lastName}</p>
                <p className="text-xs text-muted-foreground">
                  {REP_DETAILS[selectedRep.id]?.title ?? "Sales Representative"}
                  {REP_DETAILS[selectedRep.id]?.location ? ` · ${REP_DETAILS[selectedRep.id].location}` : ""}
                </p>
                {selectedRep.id === (currentUser?.repId ?? MOCK_USER.id) && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 mt-0.5 inline-block">You</span>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Review</p>
            <ReviewRow label="Company" value={form.companyName} />
            {form.dbas && <ReviewRow label="DBAs" value={form.dbas} />}
            <ReviewRow label="Location" value={`${form.city}, ${form.state}`} />
            {form.unitCount && <ReviewRow label="Units" value={parseInt(form.unitCount, 10).toLocaleString()} />}
            {form.website && <ReviewRow label="Website" value={form.website} />}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
        <div>
          {isClientMode && step === 2 ? (
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          )}
          {saveError && (
            <p className="mt-2 text-xs text-destructive">{saveError}</p>
          )}
        </div>

        {isClientMode && step === 1 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!step1Valid}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={(isClientMode ? !step2Valid : !step1Valid) || saving}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all",
              isClientMode
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isClientMode ? <Check className="w-4 h-4" /> : <TrendingUp className="w-3.5 h-3.5" />}
            {saving ? "Saving..." : isClientMode ? "Add Client" : "Create Prospect"}
          </button>
        )}
      </div>
    </WizardOverlay>
  );
}

export function AddClientWizard({ onClose, onSuccess }: Props) {
  return <SharedClientWizard onClose={onClose} onSuccess={onSuccess} mode="client" />;
}

export function CreateProspectWizard({ onClose, onSuccess }: Props) {
  return <SharedClientWizard onClose={onClose} onSuccess={onSuccess} mode="prospect" />;
}

export const inputCls = "w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background placeholder-gray-300 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all";

export function Field({ label, hint, required, children }: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
        {hint && <span className="ml-1.5 normal-case font-normal text-muted-foreground/70">- {hint}</span>}
      </label>
      {children}
    </div>
  );
}

export function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="text-muted-foreground w-20 flex-shrink-0">{label}</span>
      <span className="font-medium text-foreground truncate">{value}</span>
    </div>
  );
}

export function WizardOverlay({ children, onClose, title, icon }: {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  icon?: React.ReactNode;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div className="w-full max-w-lg" onClick={(event) => event.stopPropagation()}>
        <ModalContainer
          title={title ?? "Add New Client"}
          icon={<div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">{icon ?? <Building2 className="w-4 h-4 text-primary" />}</div>}
          onClose={onClose}
          className="max-w-lg"
        >
          {children}
        </ModalContainer>
      </div>
    </div>,
    document.body
  );
}
