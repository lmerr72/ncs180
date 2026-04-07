import { formatLabel } from "@/helpers/formatters";
import CustomSelect from "@/components/shared/CustomSelect";
import { cn } from "@/lib/utils";
import { ClientStatus } from "@/types/api";
import { Check, CircleOff, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { STATUS_CONFIG } from "./constants";

type InactiveReason = "Moved to another company" | "Integration issues" | "Not a good fit" | "Other";

const INACTIVE_REASONS: InactiveReason[] = [
    "Moved to another company",
    "Integration issues",
    "Not a good fit",
    "Other",
  ];

export function StatusModal({
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
              {(["active", "onboarding", "prospecting", "inactive"] as ClientStatus[]).map(s => {
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
                        {s === "prospecting" && "Client is in early-stage outreach"}
                        {s === "onboarding" && "Client is in the process of onboarding"}
                        {s === "inactive" && "Client has stopped activity — requires reason"}
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
                  <CustomSelect
                    value={reason}
                    onChange={setReason}
                    placeholder="Select a reason..."
                    options={INACTIVE_REASONS.map((value) => ({ value, label: value }))}
                    className={cn(
                      reason ? "border-border focus:border-primary focus:ring-primary/10" : "border-red-300 focus:border-red-400 focus:ring-red-100"
                    )}
                  />
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
