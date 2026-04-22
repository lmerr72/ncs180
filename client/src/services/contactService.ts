import { gql } from "@apollo/client";
import { apolloClient } from "@/lib/apollo";
import { createAuditLogEntry } from "@/services/auditLogService";

export type GraphqlContact = {
  id: string;
  firstName: string;
  lastName: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedIn?: string | null;
  isPrimary?: boolean | null;
  clientIds?: string[];
};

export type ContactQueryData = {
  contact: GraphqlContact | null;
};

export type ContactQueryVariables = {
  id: string;
};

export type ClientContactsQueryData = {
  contacts: GraphqlContact[];
};

export type ClientContactsQueryVariables = {
  clientId: string;
};

export type CreateContactMutationData = {
  createContact: GraphqlContact;
};

export type CreateContactMutationVariables = {
  clientId: string;
  input: {
    firstName: string;
    lastName: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedIn?: string;
    isPrimary?: boolean;
  };
};

export type BulkCreateContactsMutationData = {
  bulkCreateContacts: GraphqlContact[];
};

export type BulkCreateContactsMutationVariables = {
  clientId: string;
  inputs: CreateContactMutationVariables["input"][];
};

export type UpdateContactMutationData = {
  updateContact: GraphqlContact;
};

export type UpdateContactMutationVariables = {
  id: string;
  input: Partial<CreateContactMutationVariables["input"]>;
};

export type DeleteContactMutationData = {
  deleteContact: GraphqlContact;
};

export type DeleteContactMutationVariables = {
  id: string;
};

export const CONTACT_FIELDS = gql`
  fragment ContactFields on Contact {
    id
    firstName
    lastName
    title
    email
    phone
    linkedIn
    isPrimary
    clientIds
  }
`;

export const CONTACT_QUERY = gql`
  query Contact($id: ID!) {
    contact(id: $id) {
      ...ContactFields
    }
  }
  ${CONTACT_FIELDS}
`;

export const CLIENT_CONTACTS_QUERY = gql`
  query ClientContacts($clientId: ID!) {
    contacts(clientId: $clientId) {
      ...ContactFields
    }
  }
  ${CONTACT_FIELDS}
`;

export const CREATE_CONTACT_MUTATION = gql`
  mutation CreateContact($clientId: ID!, $input: CreateContactInput!) {
    createContact(clientId: $clientId, input: $input) {
      ...ContactFields
    }
  }
  ${CONTACT_FIELDS}
`;

export const BULK_CREATE_CONTACTS_MUTATION = gql`
  mutation BulkCreateContacts($clientId: ID!, $inputs: [CreateContactInput!]!) {
    bulkCreateContacts(clientId: $clientId, inputs: $inputs) {
      ...ContactFields
    }
  }
  ${CONTACT_FIELDS}
`;

export const UPDATE_CONTACT_MUTATION = gql`
  mutation UpdateContact($id: ID!, $input: UpdateContactInput!) {
    updateContact(id: $id, input: $input) {
      ...ContactFields
    }
  }
  ${CONTACT_FIELDS}
`;

export const DELETE_CONTACT_MUTATION = gql`
  mutation DeleteContact($id: ID!) {
    deleteContact(id: $id) {
      ...ContactFields
    }
  }
  ${CONTACT_FIELDS}
`;

function normalizeContact(contact: GraphqlContact): GraphqlContact {
  return {
    ...contact,
    title: contact.title ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    linkedIn: contact.linkedIn ?? null,
    isPrimary: contact.isPrimary ?? false,
    clientIds: contact.clientIds ?? []
  };
}

function getContactDisplayName(contact: Pick<GraphqlContact, "firstName" | "lastName">): string {
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  return fullName || "Unknown contact";
}

export async function createContact(
  clientId: string,
  input: CreateContactMutationVariables["input"],
  author: string,
  repId: string = author
): Promise<GraphqlContact> {
  const response = await apolloClient.mutate<CreateContactMutationData, CreateContactMutationVariables>({
    mutation: CREATE_CONTACT_MUTATION,
    variables: {
      clientId,
      input
    }
  });

  const createdContact = response.data?.createContact;
  if (!createdContact) {
    throw new Error("Contact creation did not return a record.");
  }

  await createAuditLogEntry({
    clientId,
    action: `Added contact: ${getContactDisplayName(createdContact)}`,
    author,
    repId,
    type: "create"
  });

  return normalizeContact(createdContact);
}

export async function bulkCreateContacts(
  clientId: string,
  inputs: BulkCreateContactsMutationVariables["inputs"],
  author: string,
  repId: string = author
): Promise<GraphqlContact[]> {
  const response = await apolloClient.mutate<BulkCreateContactsMutationData, BulkCreateContactsMutationVariables>({
    mutation: BULK_CREATE_CONTACTS_MUTATION,
    variables: {
      clientId,
      inputs
    }
  });

  const createdContacts = response.data?.bulkCreateContacts ?? [];

  await Promise.all(
    createdContacts.map((contact) =>
      createAuditLogEntry({
        clientId,
        action: `Added contact: ${getContactDisplayName(contact)}`,
        author,
        repId,
        type: "create"
      })
    )
  );

  return createdContacts.map(normalizeContact);
}

export async function updateContact(
  id: string,
  input: UpdateContactMutationVariables["input"],
  clientId: string,
  author: string,
  repId: string = author
): Promise<GraphqlContact> {
  const response = await apolloClient.mutate<UpdateContactMutationData, UpdateContactMutationVariables>({
    mutation: UPDATE_CONTACT_MUTATION,
    variables: {
      id,
      input
    }
  });

  const updatedContact = response.data?.updateContact;
  if (!updatedContact) {
    throw new Error("Contact update did not return a record.");
  }

  await createAuditLogEntry({
    clientId,
    action: "Updated contact details", // hippo make more specific
    author,
    repId,
    type: "update"
  });

  return normalizeContact(updatedContact);
}

export async function deleteContact(
  id: string,
  clientId: string,
  author: string,
  repId: string = author
): Promise<string> {
  const response = await apolloClient.mutate<DeleteContactMutationData, DeleteContactMutationVariables>({
    mutation: DELETE_CONTACT_MUTATION,
    variables: {
      id
    }
  });

  const deletedContact = response.data?.deleteContact;
  if (!deletedContact) {
    throw new Error("Contact deletion did not return a record.");
  }

  await createAuditLogEntry({
    clientId,
    action: `Deleted contact: ${getContactDisplayName(deletedContact)}`,
    author,
    repId,
    type: "delete"
  });

  return deletedContact.id;
}
