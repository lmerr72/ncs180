import { createPortal } from "react-dom";
import { formatApolloContactName } from "@/helpers/formatters";

type Contact = {
  firstName: string;
  lastName: string;
};

type DeleteContactConfirmModalProps = {
  contact: Contact;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteContactConfirmModal({
  contact,
  deleting,
  onClose,
  onConfirm,
}: DeleteContactConfirmModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <h2 className="text-lg font-bold text-foreground">Delete Contact?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Remove <span className="font-semibold text-foreground">{formatApolloContactName(contact)}</span> from this client profile?
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            This will delete the contact record and remove it from the client's points of contact list.
          </div>
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
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Delete contact"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
