import { gql } from "@apollo/client";
import type { UserProfile } from "@/types/api";
import { CLIENT_FIELDS, type GraphqlClient } from "@/services/clientService";

export type SalesRepProfileQueryData = {
  users: UserProfile[];
  allClients: GraphqlClient[];
};

export const SALES_REP_PROFILE_QUERY = gql`
  query SalesRepProfileData {
    users {
      id
      firstName
      lastName
      email
      title
      role
      initials
    }
    allClients {
      ...ClientFields
    }
  }
  ${CLIENT_FIELDS}
`;
