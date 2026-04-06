import { gql } from "@apollo/client";

export type InitialGraphqlSetupData = {
  health: {
    status: string;
    service: string;
  };
  currentUser: {
    firstName: string;
  };
  myClients: Array<{
    id: string;
  }>;
};

export const INITIAL_GRAPHQL_QUERY = gql`
  query InitialGraphqlSetup {
    health {
      status
      service
    }
    currentUser {
      firstName
    }
    myClients {
      id
    }
  }
`;
