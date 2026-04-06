import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { RemoveTypenameFromVariablesLink } from "@apollo/client/link/remove-typename";
import { createBrowserLogger } from "@/lib/logger";

const apolloLogger = createBrowserLogger("apollo");

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `gql-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

const requestLoggingLink = new ApolloLink((operation, forward) => {
  const requestId = createRequestId();
  const startedAt = Date.now();
  const operationName = operation.operationName || "anonymous";

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      "x-request-id": requestId
    },
    requestId,
    startedAt
  }));

  apolloLogger.debug("GraphQL request started", {
    requestId,
    operationName,
    variableKeys: Object.keys(operation.variables ?? {})
  });

  return forward(operation);
});

const errorLoggingLink = onError(({ operation, error }) => {
  if (!error) {
    return;
  }

  const context = operation.getContext();
  apolloLogger.error("GraphQL request failed", {
    requestId: context.requestId,
    operationName: operation.operationName || "anonymous",
    durationMs: typeof context.startedAt === "number" ? Date.now() - context.startedAt : undefined,
    error
  });
});

const httpLink = new HttpLink({
  uri: '/graphql'
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    new RemoveTypenameFromVariablesLink(),
    requestLoggingLink,
    errorLoggingLink,
    httpLink,
  ]),
  cache: new InMemoryCache(),
});
