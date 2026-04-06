import { gql } from "@apollo/client";
import { apolloClient } from "@/lib/apollo";
import type { UserProfile } from "@/types/api";

export type UsersContextQueryData = {
  currentUser: UserProfile | null;
  users: UserProfile[];
};

export const USERS_CONTEXT_QUERY = gql`
  query UsersContext {
    currentUser {
      id
      firstName
      lastName
      email
      title
      role
      initials
    }
    users {
      id
      firstName
      lastName
      email
      title
      role
      initials
    }
  }
`;

export async function getUsersContext(): Promise<UsersContextQueryData> {
  const response = await apolloClient.query<UsersContextQueryData>({
    query: USERS_CONTEXT_QUERY,
    fetchPolicy: "network-only"
  });

  return response.data;
}
