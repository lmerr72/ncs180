import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ModalContainer } from "@/components/shared/ModalContainer";

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
      <DialogContent className="max-w-2xl border-none bg-transparent p-0 shadow-none [&>button]:hidden">
        <ModalContainer
          title="Edit Client Information"
          description="Update unit count and address for this account."
          onClose={() => onOpenChange(false)}
          primaryAction={{
            label: saving ? "Saving..." : "Save changes",
            onClick: onSave,
            disabled: saving,
          }}
          secondaryAction={{
            label: "Cancel",
            onClick: () => onOpenChange(false),
            disabled: saving,
          }}
          bodyClassName="space-y-5"
        >
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
        </ModalContainer>
      </DialogContent>
    </Dialog>
  );
}
