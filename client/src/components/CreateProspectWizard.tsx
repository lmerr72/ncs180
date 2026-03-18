import { useState, useRef, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Wand2, Check, Building2, TrendingUp, AlertTriangle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MOCK_REPS, MOCK_USER, STATE_TERRITORIES, REP_KEY_TO_ID,
  MOCK_ALL_CLIENTS, MOCK_PROSPECTS,
  type ProspectStatus,
} from "@/lib/mock-data";
import {
  inputCls, Field, ReviewRow, WizardOverlay,
} from "@/components/AddClientWizard";
import type { UserProfile } from "@/types/api";

// ── Constants ────────────────────────────────────────────────────────────────

const ALL_REPS: UserProfile[] = [
  { id: MOCK_USER.id, firstName: MOCK_USER.firstName, lastName: MOCK_USER.lastName, role: MOCK_USER.role, initials: MOCK_USER.initials },
  ...MOCK_REPS.filter(r => r.id !== MOCK_USER.id && r.id !== "u3"),
];

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

const STATE_ABBR: Record<string, string> = {
  Alabama:"AL",Alaska:"AK",Arizona:"AZ",Arkansas:"AR",California:"CA",Colorado:"CO",
  Connecticut:"CT",Delaware:"DE",Florida:"FL",Georgia:"GA",Hawaii:"HI",Idaho:"ID",
  Illinois:"IL",Indiana:"IN",Iowa:"IA",Kansas:"KS",Kentucky:"KY",Louisiana:"LA",
  Maine:"ME",Maryland:"MD",Massachusetts:"MA",Michigan:"MI",Minnesota:"MN",
  Mississippi:"MS",Missouri:"MO",Montana:"MT",Nebraska:"NE",Nevada:"NV",
  "New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY",
  "North Carolina":"NC","North Dakota":"ND",Ohio:"OH",Oklahoma:"OK",Oregon:"OR",
  Pennsylvania:"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD",
  Tennessee:"TN",Texas:"TX",Utah:"UT",Vermont:"VT",Virginia:"VA",Washington:"WA",
  "West Virginia":"WV",Wisconsin:"WI",Wyoming:"WY",
};

const ALL_STATUSES: ProspectStatus[] = ["Verbal", "In Communication", "Awaiting Review", "Pending"];

const STATUS_STYLES: Record<ProspectStatus, { badge: string; dot: string }> = {
  "Verbal":           { badge: "bg-sky-100    text-sky-700    border-sky-200",    dot: "bg-sky-400"    },
  "In Communication": { badge: "bg-teal-100   text-teal-700   border-teal-200",   dot: "bg-teal-400"   },
  "Awaiting Review":  { badge: "bg-amber-100  text-amber-700  border-amber-200",  dot: "bg-amber-400"  },
  "Pending":          { badge: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-400" },
};

const ALL_COMPANY_NAMES = MOCK_ALL_CLIENTS.map(c => c.companyName);

// ── CompanyTypeahead ─────────────────────────────────────────────────────────

function CompanyTypeahead({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const trimmed = value.trim().toLowerCase();
  const suggestions = trimmed.length >= 1
    ? ALL_COMPANY_NAMES.filter(n => n.toLowerCase().includes(trimmed)).slice(0, 7)
    : [];
  const exactMatch = ALL_COMPANY_NAMES.find(n => n.toLowerCase() === trimmed);
  const hasSuggestions = suggestions.length > 0 && open && !exactMatch;
  const showNoMatch = trimmed.length >= 2 && open && suggestions.length === 0 && !exactMatch;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
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
          placeholder="e.g. Bridgewater Flats"
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className={cn(inputCls, "pl-9", exactMatch && "border-amber-400 focus:border-amber-500 focus:ring-amber-100")}
        />
      </div>

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
              <button key={name} type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onChange(name); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-primary/5 hover:text-primary transition-colors group"
              >
                <Building2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                <span>{before}<span className="font-bold text-primary">{match}</span>{after}</span>
              </button>
            );
          })}
        </div>
      )}

      {showNoMatch && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-10 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <button type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-primary/5 transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <Building2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs mb-0.5">No match found</p>
              <p className="font-semibold text-foreground">Create new prospect: <span className="text-primary">"{value.trim()}"</span></p>
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

// ── Wizard ───────────────────────────────────────────────────────────────────

interface FormData {
  companyName: string;
  dbas: string;
  website: string;
  linkedin: string;
  city: string;
  state: string;
  unitCount: string;
  prospectStatus: ProspectStatus;
  assignedRepId: string;
}

const EMPTY: FormData = {
  companyName: "", dbas: "", website: "", linkedin: "",
  city: "", state: "", unitCount: "",
  prospectStatus: "Verbal",
  assignedRepId: "",
};

type Step = 1 | 2;

interface Props {
  onClose: () => void;
  onCreated: (prospect: typeof MOCK_PROSPECTS[0]) => void;
}

export function CreateProspectWizard({ onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [seedSuccess, setSeedSuccess] = useState(false);

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSeed() {
    const name = form.companyName.trim();
    if (name.length < 2) return;
    setSeeding(true); setSeedError(null); setSeedSuccess(false);
    try {
      const resp = await fetch("/api/seed-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: name }),
      });
      if (!resp.ok) throw new Error(`Server error ${resp.status}`);
      const data = await resp.json() as {
        website: string | null; linkedin: string | null; dbas: string;
        city: string | null; state: string | null; unitCount: string | null;
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
    } catch {
      setSeedError("Couldn't fetch company data. Try again.");
    } finally {
      setSeeding(false);
    }
  }

  // Auto-assign by territory
  const repKey = STATE_TERRITORIES[form.state];
  const autoRepId = repKey && repKey !== "open" ? REP_KEY_TO_ID[repKey] : null;
  function handleAutoAssign() { if (autoRepId) set("assignedRepId", autoRepId); }

  const selectedRep = ALL_REPS.find(r => r.id === form.assignedRepId) ?? null;
  const step1Valid = form.companyName.trim() && form.city.trim() && form.state;
  const step2Valid = !!form.assignedRepId;

  function handleSubmit() {
    const cityStr = form.city.trim();
    const stateAbbr = STATE_ABBR[form.state] ?? form.state;
    const newProspect = {
      id: `p${Date.now()}`,
      companyName: form.companyName.trim(),
      location: `${cityStr}, ${stateAbbr}`,
      unitCount: parseInt(form.unitCount) || 0,
      status: form.prospectStatus,
    };
    onCreated(newProspect);
    setSubmitted(true);
  }

  const statusStyle = STATUS_STYLES[form.prospectStatus];

  // ── Success ──
  if (submitted) {
    return (
      <WizardOverlay onClose={onClose} title="Create Prospect" icon={<TrendingUp className="w-4 h-4 text-primary" />}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Prospect Created!</h2>
          <p className="text-muted-foreground text-sm mb-1">
            <span className="font-semibold text-foreground">{form.companyName}</span> has been added to your Pipeline.
          </p>
          <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mt-2 mb-6", statusStyle.badge)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", statusStyle.dot)} />
            {form.prospectStatus}
          </div>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            Done
          </button>
        </div>
      </WizardOverlay>
    );
  }

  return (
    <WizardOverlay onClose={onClose} title="Create Prospect" icon={<TrendingUp className="w-4 h-4 text-primary" />}>
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {([1, 2] as Step[]).map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
              step === s ? "bg-primary border-primary text-primary-foreground"
                : s < step ? "bg-emerald-500 border-emerald-500 text-white"
                : "bg-muted border-border text-muted-foreground"
            )}>
              {s < step ? <Check className="w-3.5 h-3.5" /> : s}
            </div>
            <span className={cn("text-xs font-medium", step === s ? "text-foreground" : "text-muted-foreground")}>
              {s === 1 ? "Prospect Info" : "Assignment"}
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
                <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg><span>Searching…</span></>
              ) : seedSuccess ? (
                <><Check className="w-3.5 h-3.5" /><span>Fields filled!</span></>
              ) : (
                <><Wand2 className="w-3.5 h-3.5" /><span>Seed with Agent</span></>
              )}
            </button>
            {seedError && (
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />{seedError}
              </span>
            )}
            {!seedError && !seeding && !seedSuccess && form.companyName.trim().length >= 2 && (
              <span className="text-xs text-muted-foreground">Auto-fill fields using AI</span>
            )}
          </div>

          {/* Prospect Status */}
          <Field label="Prospect Status" required>
            <div className="grid grid-cols-2 gap-2">
              {ALL_STATUSES.map(s => {
                const st = STATUS_STYLES[s];
                const active = form.prospectStatus === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("prospectStatus", s)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-2 text-sm font-semibold text-left transition-all",
                      active
                        ? cn(st.badge, "border-current ring-2 ring-offset-1 ring-current/30")
                        : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", active ? st.dot : "bg-muted-foreground/30")} />
                    {s}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="DBAs" hint="Also known as — separate with commas">
            <input type="text" placeholder="e.g. Bridgewater Realty"
              value={form.dbas} onChange={e => set("dbas", e.target.value)} className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Website">
              <input type="text" placeholder="https://..." value={form.website}
                onChange={e => set("website", e.target.value)} className={inputCls} />
            </Field>
            <Field label="LinkedIn URL">
              <input type="text" placeholder="https://linkedin.com/..." value={form.linkedin}
                onChange={e => set("linkedin", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="City" required>
              <input type="text" placeholder="e.g. Charlotte" value={form.city}
                onChange={e => set("city", e.target.value)} className={inputCls} />
            </Field>
            <Field label="State" required>
              <select value={form.state} onChange={e => set("state", e.target.value)}
                className={cn(inputCls, "cursor-pointer")}>
                <option value="">— Select —</option>
                {US_STATES.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Unit Count">
            <input type="number" placeholder="e.g. 4200" value={form.unitCount}
              onChange={e => set("unitCount", e.target.value)} className={inputCls} />
          </Field>

          <div className="flex justify-end pt-2">
            <button
              disabled={!step1Valid}
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next: Assignment <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Review card */}
          <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Prospect Summary</p>
            <ReviewRow label="Company" value={form.companyName} />
            <ReviewRow label="Location" value={`${form.city}, ${STATE_ABBR[form.state] ?? form.state}`} />
            {form.unitCount && <ReviewRow label="Units" value={parseInt(form.unitCount).toLocaleString()} />}
            <div className="flex items-baseline gap-2 text-sm pt-1">
              <span className="text-muted-foreground w-20 flex-shrink-0">Status</span>
              <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border", statusStyle.badge)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", statusStyle.dot)} />
                {form.prospectStatus}
              </span>
            </div>
          </div>

          {/* Territory auto-assign */}
          {autoRepId && (
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-primary/5 border border-primary/20">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-primary">Territory Match</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ALL_REPS.find(r => r.id === autoRepId)?.firstName} {ALL_REPS.find(r => r.id === autoRepId)?.lastName} covers {form.state}
                </p>
              </div>
              <button onClick={handleAutoAssign}
                className="flex-shrink-0 text-xs font-bold text-primary hover:underline">
                Auto-assign
              </button>
            </div>
          )}

          <Field label="Assign Rep" required>
            <select value={form.assignedRepId} onChange={e => set("assignedRepId", e.target.value)}
              className={cn(inputCls, "cursor-pointer flex-1")}>
              <option value="">— Select a rep —</option>
              {ALL_REPS.map(r => (
                <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>
              ))}
            </select>
          </Field>

          {selectedRep && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {selectedRep.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedRep.firstName} {selectedRep.lastName}</p>
                <p className="text-xs text-emerald-700 capitalize">{selectedRep.role?.replace("_", " ")}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              disabled={!step2Valid}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <TrendingUp className="w-3.5 h-3.5" /> Create Prospect
            </button>
          </div>
        </div>
      )}
    </WizardOverlay>
  );
}
