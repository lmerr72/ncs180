import { createPortal } from "react-dom";
import { formatApolloContactName } from "@/helpers/formatters";
import { ModalContainer } from "@/components/shared/ModalContainer";

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
    <div className="fixed inset-0 z-[210] flex items-start justify-center bg-black/60 px-4 pt-16 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl" onClick={(event) => event.stopPropagation()}>
        <ModalContainer
          title="Edit Contact"
          description={formatApolloContactName(contact)}
          onClose={onClose}
          className="max-w-xl"
          bodyClassName="space-y-4"
          secondaryAction={{ label: "Cancel", onClick: onClose }}
          primaryAction={{
            label: saving ? "Saving..." : "Save changes",
            onClick: onSave,
            disabled: !isValid || saving,
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="First Name *"
              value={contact.firstName}
              onChange={(event) => setField("firstName", event.target.value)}
              className="w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={contact.lastName}
              onChange={(event) => setField("lastName", event.target.value)}
              className="w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Job Title"
              value={contact.title}
              onChange={(event) => setField("title", event.target.value)}
              className="w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={contact.email}
              onChange={(event) => setField("email", event.target.value)}
              className="w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Phone Number"
              value={contact.phone}
              onChange={(event) => setField("phone", event.target.value)}
              className="w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
            <input
              type="text"
              placeholder="LinkedIn URL"
              value={contact.linkedIn}
              onChange={(event) => setField("linkedIn", event.target.value)}
              className="w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={contact.isPrimary}
              onChange={(event) => setField("isPrimary", event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Set as primary contact
          </label>
        </ModalContainer>
      </div>
    </div>,
    document.body
  );
}
