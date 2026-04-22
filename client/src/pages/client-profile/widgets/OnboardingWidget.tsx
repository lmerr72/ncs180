import { formatLabel } from "@/helpers/formatters";
import { cn } from "@/lib/utils";
import { OnboardingChecklist } from "@/types/api";
import { CheckCircle2, Handshake, Hash } from "lucide-react";

const ONBOARDING_CHECKLIST_FIELDS: Array<keyof OnboardingChecklist> = [
    "agreement_signed",
    "property_list_created",
    "ach",
    "integration_setup",
    "first_file_placed",
  ];

export function OnboardingWidget({
    checklist,
    clientId,
  }: {
    checklist: OnboardingChecklist;
    clientId: string;
  }) {
    const completedCount = ONBOARDING_CHECKLIST_FIELDS.reduce(
      (acc, field) => acc + (checklist[field] ? 1 : 0),
      0
    );
    return (
      <div className="bg-card rounded-2xl border border-violet-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-violet-100 bg-violet-50/70 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Handshake className="w-4 h-4 text-violet-600" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Onboarding</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700">
            <Hash className="w-3.5 h-3.5" />
            {clientId}
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Complete the onboarding checklist to move this client into an active account.</p>
            <span className="text-sm font-semibold text-foreground">
              {completedCount}/{ONBOARDING_CHECKLIST_FIELDS.length}
            </span>
          </div>
          <div className="space-y-3">
            {ONBOARDING_CHECKLIST_FIELDS.map((k) => (
              <div
                key={k}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3",
                  checklist[k]
                    ? "border-emerald-200 bg-emerald-50/70"
                    : "border-border bg-muted/10"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border",
                    checklist[k]
                      ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-400"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{k === 'ach' ? 'ACH Setup' : formatLabel(k)}</p>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    checklist[k] ? "text-emerald-700" : "text-muted-foreground"
                  )}
                >
                  {checklist[k] ? "Done" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }