import { useQuery } from "@apollo/client/react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { INITIAL_GRAPHQL_QUERY, type InitialGraphqlSetupData } from "@/services/graphqlStatusService";

export function GraphqlStatusCard() {
  const { data, loading, error } = useQuery<InitialGraphqlSetupData>(INITIAL_GRAPHQL_QUERY);

  if (loading) {
    return (
      <div className="mb-6 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Connecting to GraphQL endpoint...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 shadow-sm">
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          GraphQL setup error: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
        <CheckCircle2 className="h-4 w-4" />
        GraphQL connected to {data?.health.service} for {data?.currentUser.firstName} with{" "}
        {data?.myClients.length ?? 0} assigned clients.
      </p>
    </div>
  );
}
