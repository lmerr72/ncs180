import { Activity, Clock, Mail, PhoneCall, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/helpers/formatters";

export type HistoryEntryType = "meeting" | "email" | "call";

export type HistoryEntry = {
  id: string;
  type: HistoryEntryType;
  subject: string;
  summary: string;
  actor: string;
  timestamp: string;
};

const HISTORY_STYLES: Record<HistoryEntryType, { icon: React.ElementType; badge: string; chip: string; label: string }> = {
  meeting: {
    icon: CalendarDays,
    badge: "bg-blue-100 border-blue-300 text-blue-600",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    label: "Meeting",
  },
  email: {
    icon: Mail,
    badge: "bg-violet-100 border-violet-300 text-violet-600",
    chip: "bg-violet-50 text-violet-700 border-violet-200",
    label: "Email",
  },
  call: {
    icon: PhoneCall,
    badge: "bg-emerald-100 border-emerald-300 text-emerald-600",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Call",
  },
};

export function AccountHistoryWidget({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">History</h2>
        <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{history.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-96">
        {history.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">No meetings, emails, or calls recorded yet.</p>
        )}
        <div className="relative">
          <div className="absolute left-[2.35rem] top-0 bottom-0 w-px bg-border/60" />
          {history.map(entry => {
            const config = HISTORY_STYLES[entry.type];
            const Icon = config.icon;

            return (
              <div key={entry.id} className="flex items-start gap-4 px-5 py-4 relative hover:bg-muted/20 transition-colors">
                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 border-2", config.badge)}>
                  <Icon className="w-2.5 h-2.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <p className="text-sm text-foreground font-medium leading-snug">{entry.subject}</p>
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", config.chip)}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{entry.summary}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                    <Clock className="w-3 h-3" />
                    {entry.actor} · {timeAgo(entry.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
