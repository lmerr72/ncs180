import { createPortal } from "react-dom";
import { ModalContainer } from "@/components/shared/ModalContainer";
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
    <div className="fixed inset-0 z-[210] flex items-start justify-center bg-black/60 px-4 pt-20 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md" onClick={(event) => event.stopPropagation()}>
        <ModalContainer
          title="Delete Contact?"
          description={<>Remove <span className="font-semibold text-foreground">{formatApolloContactName(contact)}</span> from this client profile?</>}
          onClose={onClose}
          className="max-w-md"
          secondaryAction={{ label: "Cancel", onClick: onClose }}
          primaryAction={{
            label: deleting ? "Deleting..." : "Delete contact",
            onClick: onConfirm,
            disabled: deleting,
            className: "bg-red-600 text-white hover:bg-red-700",
          }}
        >
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            This will delete the contact record and remove it from the client's points of contact list.
          </div>
        </ModalContainer>
      </div>
    </div>,
    document.body
  );
}
