import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, Wand2, Check, Building2, User, AlertTriangle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MOCK_REPS, MOCK_USER, STATE_TERRITORIES, REP_KEY_TO_ID, REP_DETAILS,
  MOCK_ALL_CLIENTS,
} from "@/lib/mock-data";
import { useClients, type NewClientData } from "@/context/ClientsContext";
import type { UserProfile } from "@/types/api";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
];

// All reps including Gordon Marshall (MOCK_USER)
const ALL_REPS: UserProfile[] = [
  { id: MOCK_USER.id, firstName: MOCK_USER.firstName, lastName: MOCK_USER.lastName, role: MOCK_USER.role, initials: MOCK_USER.initials },
  ...MOCK_REPS.filter(r => r.id !== MOCK_USER.id && r.id !== "u3"), // u3 is the duplicate Gordon
];

interface Props { onClose: () => void }

type Step = 1 | 2;

interface FormData {
  companyName: string;
  dbas: string;
  website: string;
  linkedin: string;
  city: string;
  state: string;
  unitCount: string;
  assignedRepId: string;
}

const EMPTY: FormData = {
  companyName: "", dbas: "", website: "", linkedin: "",
  city: "", state: "", unitCount: "", assignedRepId: "",
};

const ALL_COMPANY_NAMES = MOCK_ALL_CLIENTS.map(c => c.companyName);

interface CompanyTypeaheadProps {
  value: string;
  onChange: (val: string) => void;
}

function CompanyTypeahead({ value, onChange }: CompanyTypeaheadProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = value.trim().toLowerCase();

  const suggestions = trimmed.length >= 1
    ? ALL_COMPANY_NAMES.filter(n => n.toLowerCase().includes(trimmed)).slice(0, 7)
    : [];

  const exactMatch = ALL_COMPANY_NAMES.find(
    n => n.toLowerCase() === trimmed
  );

  const hasSuggestions = suggestions.length > 0 && open && !exactMatch;
  const showNoMatch = trimmed.length >= 2 && open && suggestions.length === 0 && !exactMatch;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className={cn(
            inputCls,
            "pl-9",
            exactMatch && "border-amber-400 focus:border-amber-500 focus:ring-amber-100"
          )}
        />
      </div>

      {/* Suggestions dropdown */}
      {hasSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-10 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border/50 bg-muted/20">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Existing companies</p>
          </div>
          {suggestions.map(name => {
            const idx = name.toLowerCase().indexOf(trimmed);
            const before = name.slice(0, idx);
            const match = name.slice(idx, idx + trimmed.length);
            const after = name.slice(idx + trimmed.length);
            return (
              <button
                key={name}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onChange(name); setOpen(false); }}
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

      {/* No-match option */}
      {showNoMatch && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-10 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-primary/5 transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <Building2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs mb-0.5">No match found</p>
              <p className="font-semibold text-foreground">
                Create new client: <span className="text-primary">"{value.trim()}"</span>
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Exact-match duplicate warning */}
      {exactMatch && (
        <div className="mt-2 flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">Possible duplicate</p>
            <p className="text-xs text-amber-700 mt-0.5">
              <span className="font-semibold">"{exactMatch}"</span> already exists in the system.
              Are you sure you're not creating a duplicate company?
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function AddClientWizard({ onClose }: Props) {
  const { addClient } = useClients();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [seedSuccess, setSeedSuccess] = useState(false);

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSeed() {
    const name = form.companyName.trim();
    if (name.length < 2) return;
    setSeeding(true);
    setSeedError(null);
    setSeedSuccess(false);
    try {
      const resp = await fetch("/api/seed-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: name }),
      });
      if (!resp.ok) throw new Error(`Server error ${resp.status}`);
      const data = await resp.json() as {
        website: string | null;
        linkedin: string | null;
        dbas: string;
        city: string | null;
        state: string | null;
        unitCount: string | null;
      };
      setForm(prev => ({
        ...prev,
        website:   data.website   ?? prev.website,
        linkedin:  data.linkedin  ?? prev.linkedin,
        dbas:      data.dbas      || prev.dbas,
        city:      data.city      ?? prev.city,
        state:     data.state     ?? prev.state,
        unitCount: data.unitCount ?? prev.unitCount,
      }));
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (err) {
      setSeedError("Couldn't fetch company data. Try again.");
    } finally {
      setSeeding(false);
    }
  }

  // Auto-assign logic
  const repKey = STATE_TERRITORIES[form.state];
  const isOpenTerritory = !form.state || repKey === "open" || !repKey;
  const autoRepId = repKey && repKey !== "open" ? REP_KEY_TO_ID[repKey] : null;

  function handleAutoAssign() {
    if (autoRepId) set("assignedRepId", autoRepId);
  }

  const selectedRep = ALL_REPS.find(r => r.id === form.assignedRepId) ?? null;

  const step1Valid = form.companyName.trim() && form.city.trim() && form.state;
  const step2Valid = !!form.assignedRepId;

  function handleSubmit() {
    if (!selectedRep) return;
    const data: NewClientData = {
      companyName: form.companyName.trim(),
      dbas: form.dbas.trim(),
      website: form.website.trim(),
      linkedin: form.linkedin.trim(),
      city: form.city.trim(),
      state: form.state,
      unitCount: parseInt(form.unitCount) || 0,
      assignedRep: selectedRep,
    };
    addClient(data);
    setSubmitted(true);
  }

  // Success screen
  if (submitted) {
    return (
      <WizardOverlay onClose={onClose}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Client Added!</h2>
          <p className="text-muted-foreground text-sm mb-1">
            <span className="font-semibold text-foreground">{form.companyName}</span> has been added to All Clients.
          </p>
          {selectedRep?.id === MOCK_USER.id && (
            <p className="text-xs text-emerald-600 font-medium mb-6">Also visible in your My Clients page.</p>
          )}
          {selectedRep?.id !== MOCK_USER.id && <div className="mb-6" />}
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
    <WizardOverlay onClose={onClose}>
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {([1, 2] as Step[]).map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
              step === s
                ? "bg-primary border-primary text-primary-foreground"
                : s < step
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "bg-muted border-border text-muted-foreground"
            )}>
              {s < step ? <Check className="w-3.5 h-3.5" /> : s}
            </div>
            <span className={cn("text-xs font-medium", step === s ? "text-foreground" : "text-muted-foreground")}>
              {s === 1 ? "Company Info" : "Assignment"}
            </span>
            {s < 2 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 ml-1" />}
          </div>
        ))}
      </div>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="space-y-4">
          <Field label="Company Name" required>
            <CompanyTypeahead
              value={form.companyName}
              onChange={val => { set("companyName", val); setSeedError(null); setSeedSuccess(false); }}
            />
          </Field>

          {/* Seed with Agent */}
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
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
                  <span>Seed with Agent</span>
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
              <span className="text-xs text-muted-foreground">Auto-fill fields using AI</span>
            )}
          </div>

          <Field label="DBAs" hint="Also known as — separate multiple with commas">
            <input
              type="text"
              placeholder="e.g. Synergy Realty, Synergy Living"
              value={form.dbas}
              onChange={e => set("dbas", e.target.value)}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Website">
              <input
                type="text"
                placeholder="https://..."
                value={form.website}
                onChange={e => set("website", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="LinkedIn URL">
              <input
                type="text"
                placeholder="https://linkedin.com/company/..."
                value={form.linkedin}
                onChange={e => set("linkedin", e.target.value)}
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
                onChange={e => set("city", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="State" required>
              <select
                value={form.state}
                onChange={e => set("state", e.target.value)}
                className={cn(inputCls, "cursor-pointer")}
              >
                <option value="">Select state...</option>
                {US_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Unit Count">
            <input
              type="number"
              placeholder="e.g. 2500"
              min={0}
              value={form.unitCount}
              onChange={e => set("unitCount", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Territory hint */}
          {form.state && (
            <div className={cn(
              "rounded-xl px-4 py-3 text-sm flex items-center gap-2.5 border",
              isOpenTerritory
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            )}>
              <Building2 className="w-4 h-4 flex-shrink-0" />
              {isOpenTerritory
                ? <span><strong>{form.state}</strong> is an open territory — auto-assign is not available.</span>
                : <span><strong>{form.state}</strong> is assigned to <strong>{autoRepId ? `${REP_DETAILS[autoRepId]?.firstName} ${REP_DETAILS[autoRepId]?.lastName}` : "a rep"}</strong>.</span>
              }
            </div>
          )}

          {/* Rep selector + Auto-assign */}
          <Field label="Assigned Rep" required>
            <div className="flex gap-2">
              <select
                value={form.assignedRepId}
                onChange={e => set("assignedRepId", e.target.value)}
                className={cn(inputCls, "cursor-pointer flex-1")}
              >
                <option value="">Select a rep...</option>
                {ALL_REPS.map(rep => (
                  <option key={rep.id} value={rep.id}>
                    {rep.firstName} {rep.lastName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAutoAssign}
                disabled={isOpenTerritory}
                title={isOpenTerritory ? "Open territory — no rep assigned" : "Auto-assign based on territory"}
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

          {/* Selected rep preview card */}
          {selectedRep && (
            <div className="rounded-xl border border-border bg-muted/20 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {selectedRep.initials}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{selectedRep.firstName} {selectedRep.lastName}</p>
                <p className="text-xs text-muted-foreground">
                  {REP_DETAILS[selectedRep.id]?.title ?? "Sales Representative"}
                  {REP_DETAILS[selectedRep.id]?.location ? ` · ${REP_DETAILS[selectedRep.id].location}` : ""}
                </p>
                {selectedRep.id === MOCK_USER.id && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 mt-0.5 inline-block">You</span>
                )}
              </div>
            </div>
          )}

          {/* Summary review */}
          <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Review</p>
            <ReviewRow label="Company" value={form.companyName} />
            {form.dbas && <ReviewRow label="DBAs" value={form.dbas} />}
            <ReviewRow label="Location" value={`${form.city}, ${form.state}`} />
            {form.unitCount && <ReviewRow label="Units" value={parseInt(form.unitCount).toLocaleString()} />}
            {form.website && <ReviewRow label="Website" value={form.website} />}
          </div>
        </div>
      )}

      {/* Footer buttons */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
        {step === 1 ? (
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
        ) : (
          <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        {step === 1 ? (
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
            disabled={!step2Valid}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Check className="w-4 h-4" /> Add Client
          </button>
        )}
      </div>
    </WizardOverlay>
  );
}

// ── Helpers (exported for reuse in other wizards) ────────────────────────────

export const inputCls = "w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all";

export function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
        {hint && <span className="ml-1.5 normal-case font-normal text-muted-foreground/70">— {hint}</span>}
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
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              {icon ?? <Building2 className="w-4 h-4 text-primary" />}
            </div>
            <h2 className="text-lg font-bold text-foreground">{title ?? "Add New Client"}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
