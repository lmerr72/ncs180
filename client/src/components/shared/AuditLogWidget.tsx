import { timeAgo } from "@/helpers/formatters";
import { createBrowserLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { getAuditLogEntries } from "@/services/auditLogService";
import { AuditEntry } from "@/types/api";
import { ClipboardList, Clock, Plus, StickyNote } from "lucide-react";
import { useEffect, useState } from "react";

const logger = createBrowserLogger("AuditLogWidget");

type AuditLogWidgetProps = {
  clientId: string;
  refreshKey?: number;
};

export default function AuditLogWidget({ clientId, refreshKey = 0 }: AuditLogWidgetProps) {
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

    useEffect(() => {
      async function loadAuditLog() {
        try {
          if (clientId)   {
            const entries = await getAuditLogEntries(clientId);
            setAuditLog(entries);
          }
        } catch(e) {
            logger.error("Failed to fetch audit log", { clientId, error: e })
            setAuditLog([]);
        }
      }

      void loadAuditLog();
    }, [clientId, refreshKey]);

    return(  <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
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
                  entry.type === "create"  && "bg-emerald-100 border-emerald-300 text-emerald-600",
                  entry.type === "update" && "bg-amber-100 border-amber-300 text-amber-600",
                  entry.type === "delete" && "bg-rose-100 border-rose-300 text-rose-600",
                  entry.type === "note" && "bg-sky-100 border-sky-300 text-sky-600",
                  entry.type === "info" && "bg-slate-100 border-slate-300 text-slate-500",
                )}>
                  {entry.type === "create"  && <Plus className="w-2.5 h-2.5" />}
                  {entry.type === "update" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block" />}
                  {entry.type === "delete" && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 block" />}
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
      </div>)
}
