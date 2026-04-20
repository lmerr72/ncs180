import { FileText, Pencil } from "lucide-react";
import type { ClientMetadata } from "@/types/api";

type ClientMetadataWidgetProps = {
  metadata: ClientMetadata;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onChange: <K extends keyof ClientMetadata>(field: K, value: ClientMetadata[K]) => void;
  onSave: () => void;
};

export function ClientMetadataWidget({
  metadata,
  editing,
  saving,
  onEdit,
  onCancel,
  onChange,
  onSave,
}: ClientMetadataWidgetProps) {
  const settledInFullValue = editing
    ? metadata.settled_in_full.toString()
    : metadata.settled_in_full.toLocaleString();

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Client Details</h2>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
        <label className="rounded-2xl border border-border bg-muted/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prelegal</p>
              <p className="mt-2 text-lg font-display font-semibold text-foreground">
                {metadata.prelegal ? "Yes" : "No"}
              </p>
            </div>
            {editing && (
              <input
                type="checkbox"
                checked={metadata.prelegal}
                onChange={(event) => onChange("prelegal", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border"
              />
            )}
          </div>
        </label>

        <label className="rounded-2xl border border-border bg-muted/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settled In Full</p>
          {editing ? (
            <input
              type="number"
              min="0"
              step="0.01"
              value={settledInFullValue}
              onChange={(event) => onChange("settled_in_full", Number(event.target.value))}
              className="mt-2 w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          ) : (
            <p className="mt-2 text-lg font-display font-semibold text-foreground">{settledInFullValue ?? '-'}</p>
          )}
        </label>

        <label className="rounded-2xl border border-border bg-muted/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Integration</p>
          {editing ? (
            <input
              type="text"
              value={metadata.integration}
              onChange={(event) => onChange("integration", event.target.value)}
              className="mt-2 w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          ) : (
            <p className="mt-2 text-lg font-display font-semibold text-foreground">{metadata.integration || "—"}</p>
          )}
        </label>

        <label className="rounded-2xl border border-border bg-muted/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tax Campaign</p>
              <p className="mt-2 text-lg font-display font-semibold text-foreground">
                {metadata.tax_campaign ? "Yes" : "No"}
              </p>
            </div>
            {editing && (
              <input
                type="checkbox"
                checked={metadata.tax_campaign}
                onChange={(event) => onChange("tax_campaign", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border"
              />
            )}
          </div>
        </label>
      </div>
    </div>
  );
}
