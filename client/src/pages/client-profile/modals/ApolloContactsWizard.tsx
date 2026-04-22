import { createPortal } from "react-dom";
import { Check, Mail, MapPin, Phone, X } from "lucide-react";
import { LinkedInIcon } from "@/components/shared/LinkedInUpdatesCard";
import { formatApolloContactName } from "@/helpers/formatters";
import { cn } from "@/lib/utils";

export type ApolloContactWizardCandidate = {
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
  dedupeKey: string;
  selected: boolean;
  alreadyExists: boolean;
};

type ApolloContactsWizardProps = {
  companyName: string;
  candidates: ApolloContactWizardCandidate[];
  warnings: string[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onToggle: (dedupeKey: string) => void;
  onSave: () => void;
};

export function ApolloContactsWizard({
  companyName,
  candidates,
  warnings,
  saving,
  error,
  onClose,
  onToggle,
  onSave,
}: ApolloContactsWizardProps) {
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
