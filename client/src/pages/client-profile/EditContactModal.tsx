import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { formatApolloContactName } from "@/helpers/formatters";

export type EditableContactForm = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  linkedIn: string;
  isPrimary: boolean;
};

type EditContactModalProps = {
  contact: EditableContactForm;
  saving: boolean;
  onChange: (contact: EditableContactForm) => void;
  onClose: () => void;
  onSave: () => void;
};

export function EditContactModal({
  contact,
  saving,
  onChange,
  onClose,
  onSave,
}: EditContactModalProps) {
  const isValid = contact.firstName.trim().length > 0;

  function setField(field: keyof EditableContactForm, value: string | boolean) {
    onChange({
      ...contact,
      [field]: value,
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div>
            <h2 className="text-lg font-bold text-foreground">Edit Contact</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{formatApolloContactName(contact)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name *"
              value={contact.firstName}
              onChange={(e) => setField("firstName", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={contact.lastName}
              onChange={(e) => setField("lastName", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Job Title"
              value={contact.title}
              onChange={(e) => setField("title", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={contact.email}
              onChange={(e) => setField("email", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Phone Number"
              value={contact.phone}
              onChange={(e) => setField("phone", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
            <input
              type="text"
              placeholder="LinkedIn URL"
              value={contact.linkedIn}
              onChange={(e) => setField("linkedIn", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={contact.isPrimary}
              onChange={(e) => setField("isPrimary", e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Set as primary contact
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
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
            disabled={!isValid || saving}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
