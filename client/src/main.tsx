import { createRoot } from "react-dom/client";
import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "./lib/apollo";
import { installGlobalErrorLogging } from "./lib/logger";
import App from "./App";
import "./index.css";

installGlobalErrorLogging();

createRoot(document.getElementById("root")!).render(
  <ApolloProvider client={apolloClient}>
    <App />
  </ApolloProvider>,
);
