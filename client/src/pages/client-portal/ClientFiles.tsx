import { useState, useRef, useCallback } from "react";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import {
  Upload, FileText, FileImage, FileSpreadsheet, File,
  CheckCircle2, XCircle, Clock, Trash2, CloudUpload,
  RefreshCw, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type HealthStatus = "Connected" | "Disconnected" | "Awaiting Integration";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

interface ActivityEntry {
  id: string;
  fileCount: number;
  uploader: string;
  date: Date;
  files: string[];
}

const HEALTH_CONFIG: Record<HealthStatus, {
  dot: string; badge: string; border: string; icon: React.ElementType; label: string; desc: string;
}> = {
  Connected:            { dot: "bg-emerald-500", badge: "text-emerald-700 bg-emerald-50 border-emerald-200",  border: "border-emerald-200/60", icon: CheckCircle2,    label: "Connected",            desc: "Integration active and syncing" },
  Disconnected:         { dot: "bg-red-500",     badge: "text-red-700 bg-red-50 border-red-200",              border: "border-red-200/60",     icon: XCircle,         label: "Disconnected",         desc: "Connection lost — contact support" },
  "Awaiting Integration": { dot: "bg-amber-500", badge: "text-amber-700 bg-amber-50 border-amber-200",        border: "border-amber-200/60",   icon: Clock,           label: "Awaiting Integration", desc: "Setup in progress" },
};

const SEED_ACTIVITY: ActivityEntry[] = [
  { id: "act1", fileCount: 3, uploader: "Kathy McGee",   date: new Date("2026-03-10T14:22:00"), files: ["Q1_Report.xlsx", "Lease_Summary.pdf", "Maintenance_Log.pdf"] },
  { id: "act2", fileCount: 1, uploader: "Kathy McGee",   date: new Date("2026-02-28T09:05:00"), files: ["February_Invoices.pdf"] },
  { id: "act3", fileCount: 5, uploader: "Gordon Marshall", date: new Date("2026-02-15T16:40:00"), files: ["Unit_Data.xlsx", "Occupancy_Jan.pdf", "Occupancy_Feb.pdf", "Rent_Roll.xlsx", "Move_Outs.csv"] },
  { id: "act4", fileCount: 2, uploader: "Kathy McGee",   date: new Date("2026-01-31T11:18:00"), files: ["Jan_Financials.pdf", "Jan_Placements.xlsx"] },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return <FileImage className="w-4 h-4 text-violet-500" />;
  if (["xlsx", "xls", "csv"].includes(ext)) return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
  if (["pdf"].includes(ext)) return <FileText className="w-4 h-4 text-red-500" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

function YardiLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text
        x="0" y="22"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="22"
        fill="#0066CC"
        letterSpacing="-0.5"
      >Yardi</text>
    </svg>
  );
}

export default function ClientFiles() {
  const [health] = useState<HealthStatus>("Connected");
  const healthCfg = HEALTH_CONFIG[health];
  const HealthIcon = healthCfg.icon;

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [activity, setActivity] = useState<ActivityEntry[]>(SEED_ACTIVITY);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const newFiles: UploadedFile[] = Array.from(incoming).map(f => ({
      id: `f${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      uploadedAt: new Date(),
    }));
    setFiles(prev => [...prev, ...newFiles]);

    const entry: ActivityEntry = {
      id: `act${Date.now()}`,
      fileCount: newFiles.length,
      uploader: "Kathy McGee",
      date: new Date(),
      files: newFiles.map(f => f.name),
    };
    setActivity(prev => [entry, ...prev]);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function handleRemove(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  return (
    <ClientPortalLayout>
      <div className="space-y-6">

        {/* ── Page title ───────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Files</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Upload and manage your documents</p>
        </div>

        {/* ── 1. Integration Health Widget ─────────────────────────────── */}
        <div className={cn(
          "bg-card rounded-2xl border shadow-sm overflow-hidden",
          healthCfg.border,
        )}>
          <div className="px-6 py-4 border-b border-border/50 bg-muted/10 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Integration Health</h2>
          </div>

          <div className="px-6 py-5 flex items-center gap-8 flex-wrap">
            {/* Yardi branding */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0066CC]/8 border border-[#0066CC]/15 flex items-center justify-center flex-shrink-0">
                <YardiLogo className="h-8 w-auto" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Platform</p>
                <p className="text-lg font-bold text-foreground">Yardi Voyager</p>
                <p className="text-xs text-muted-foreground">Property Management Software</p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-14 bg-border hidden sm:block" />

            {/* Status badge */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Connection Status</p>
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold",
                healthCfg.badge,
              )}>
                <span className={cn("w-2 h-2 rounded-full animate-pulse flex-shrink-0", healthCfg.dot)} />
                <HealthIcon className="w-4 h-4 flex-shrink-0" />
                {healthCfg.label}
              </div>
              <p className="text-xs text-muted-foreground">{healthCfg.desc}</p>
            </div>

            {/* Divider */}
            <div className="w-px h-14 bg-border hidden sm:block" />

            {/* Last sync */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Last Sync</p>
              <p className="text-sm font-semibold text-foreground">Today, 2:14 PM</p>
              <p className="text-xs text-muted-foreground">Auto-syncs every 24 hours</p>
            </div>

            {/* Divider */}
            <div className="w-px h-14 bg-border hidden sm:block" />

            {/* Records synced */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Records Synced</p>
              <p className="text-sm font-semibold text-foreground">1,284 units</p>
              <p className="text-xs text-muted-foreground">Across 6 properties</p>
            </div>
          </div>
        </div>

        {/* ── 2. File Upload + Activity (two-column) ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Upload panel (wider) */}
          <div className="lg:col-span-3 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 bg-muted/10 flex items-center gap-2">
              <CloudUpload className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Upload Files</h2>
            </div>

            <div className="p-6 space-y-5">
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 py-12 px-6 text-center select-none",
                  dragging
                    ? "border-primary bg-primary/5 scale-[1.01] shadow-inner"
                    : "border-border/60 bg-muted/10 hover:border-primary/40 hover:bg-primary/5"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                  dragging ? "bg-primary/15" : "bg-muted/50"
                )}>
                  <Upload className={cn("w-6 h-6 transition-colors", dragging ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {dragging ? "Drop files to upload" : "Drag files here or click to browse"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, Excel, CSV, Images — any file type accepted
                  </p>
                </div>
                <span className="text-xs font-medium text-primary hover:underline">Browse files</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={e => addFiles(e.target.files)}
              />

              {/* Uploaded files list */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                    Uploaded this session ({files.length})
                  </p>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {files.map(f => (
                      <div
                        key={f.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/20 border border-border/40 group hover:border-border transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0">
                          {fileIcon(f.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                          <p className="text-xs text-muted-foreground">{formatBytes(f.size)} · {formatDateTime(f.uploadedAt)}</p>
                        </div>
                        <button
                          onClick={() => handleRemove(f.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {files.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-2">No files uploaded this session yet</p>
              )}
            </div>
          </div>

          {/* Activity log (narrower) */}
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border/50 bg-muted/10 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Activity Log</h2>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/50">
              {activity.map((entry, i) => (
                <div key={entry.id} className="px-5 py-4 hover:bg-muted/20 transition-colors">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary">
                          {entry.uploader.split(" ").map(w => w[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-tight">{entry.uploader}</p>
                        <p className="text-[11px] text-muted-foreground">{formatDate(entry.date)}</p>
                      </div>
                    </div>
                    {/* File count badge */}
                    <span className={cn(
                      "text-[11px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0",
                      i === 0 && entry.uploader === "Kathy McGee" && entry.date > new Date(Date.now() - 5000)
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-muted text-muted-foreground border-border"
                    )}>
                      {entry.fileCount} {entry.fileCount === 1 ? "file" : "files"}
                    </span>
                  </div>

                  {/* File list preview */}
                  <div className="pl-9 space-y-1">
                    {entry.files.slice(0, 3).map((fname, fi) => (
                      <div key={fi} className="flex items-center gap-1.5">
                        {fileIcon(fname)}
                        <span className="text-[11px] text-muted-foreground truncate">{fname}</span>
                      </div>
                    ))}
                    {entry.files.length > 3 && (
                      <p className="text-[11px] text-muted-foreground/60 pl-5">
                        +{entry.files.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {activity.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <AlertTriangle className="w-5 h-5 opacity-30" />
                  <p className="text-sm">No activity yet</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </ClientPortalLayout>
  );
}
