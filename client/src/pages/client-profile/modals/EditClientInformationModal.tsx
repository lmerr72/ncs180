import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type EditableClientInformationForm = {
  unitCount: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
};

type EditClientInformationModalProps = {
  open: boolean;
  form: EditableClientInformationForm;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (form: EditableClientInformationForm) => void;
  onSave: () => void;
};

export function EditClientInformationModal({
  open,
  form,
  saving,
  onOpenChange,
  onChange,
  onSave,
}: EditClientInformationModalProps) {
  function setField(field: keyof EditableClientInformationForm, value: string) {
    onChange({
      ...form,
      [field]: value,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl border-border p-0 overflow-hidden">
        <DialogHeader className="border-b border-border/50 px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-display font-bold">Edit Client Information</DialogTitle>
          <DialogDescription>
            Update unit count and address for this account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit Count</label>
            <input
              type="number"
              min="0"
              value={form.unitCount}
              onChange={(event) => setField("unitCount", event.target.value)}
              className="mt-2 w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address Line 1</label>
              <input
                type="text"
                value={form.address1}
                onChange={(event) => setField("address1", event.target.value)}
                className="mt-2 w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address Line 2</label>
              <input
                type="text"
                value={form.address2}
                onChange={(event) => setField("address2", event.target.value)}
                className="mt-2 w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(event) => setField("city", event.target.value)}
                className="mt-2 w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(event) => setField("state", event.target.value)}
                className="mt-2 w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Zip Code</label>
              <input
                type="text"
                value={form.zipCode}
                onChange={(event) => setField("zipCode", event.target.value)}
                className="mt-2 w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>

        </div>

        <DialogFooter className="border-t border-border/50 bg-muted/10 px-6 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
