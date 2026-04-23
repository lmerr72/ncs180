import { gql } from "@apollo/client";
import type { UserProfile } from "@/types/api";

export type SalesRepProfileQueryData = {
  users: UserProfile[];
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
  }
`;
