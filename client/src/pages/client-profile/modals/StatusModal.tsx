import { formatLabel } from "@/helpers/formatters";
import CustomSelect from "@/components/shared/CustomSelect";
import { ModalContainer } from "@/components/shared/ModalContainer";
import { cn } from "@/lib/utils";
import { ClientStatus } from "@/types/api";
import { Check, CircleOff } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { STATUS_CONFIG } from "../constants";

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
        <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
          <ModalContainer
            title="Change Client Status"
            description={<>Current: <span className={cn("font-semibold", STATUS_CONFIG[current].badge.split(" ")[1])}>{formatLabel(current)}</span></>}
            onClose={onClose}
            className="max-w-md"
            bodyClassName="space-y-5"
            secondaryAction={{ label: "Cancel", onClick: onClose, className: "border-none px-0 py-0 hover:bg-transparent text-muted-foreground hover:text-foreground" }}
            primaryAction={{
              label: "Save Status",
              onClick: handleSave,
              disabled: !isValid || selected === current,
              className: "inline-flex items-center gap-2",
            }}
          >
            {/* Status radio options */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Status</p>
              {(["active", "prospecting", "inactive"] as ClientStatus[]).map(s => {
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
          </ModalContainer>
        </div>
      </div>,
      document.body
    );
  }
