import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientsProvider } from "@/context/ClientsContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import NotFound from "@/pages/not-found";

import SignIn from "@/pages/SignIn";

import Dashboard from "@/pages/Dashboard";
import MyClients from "@/pages/MyClients";
import AllClients from "@/pages/AllClients";
import ClientProfile from "@/pages/ClientProfile";
import CalendarPage from "@/pages/Calendar";
import Profile from "@/pages/Profile";
import Pipeline from "@/pages/Pipeline";
import Metrics from "@/pages/Metrics";
import Tasks from "@/pages/Tasks";
import SalesRepProfile from "@/pages/SalesRepProfile";

import ClientDashboard from "@/pages/client-portal/ClientDashboard";
import ClientReports from "@/pages/client-portal/ClientReports";
import ClientPortfolio from "@/pages/client-portal/ClientPortfolio";
import ClientMetrics from "@/pages/client-portal/ClientMetrics";
import ClientFiles from "@/pages/client-portal/ClientFiles";
import ClientMyRep from "@/pages/client-portal/ClientMyRep";

function SalesRepRouter() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/my-clients" element={<MyClients />} />
      <Route path="/all-clients" element={<AllClients />} />
      <Route path="/clients/:id" element={<ClientProfile />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/pipeline" element={<Pipeline />} />
      <Route path="/metrics" element={<Metrics />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/rep/:id" element={<SalesRepProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function ClientRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/client/dashboard" replace />} />
      <Route path="/client/dashboard" element={<ClientDashboard />} />
      <Route path="/client/reports" element={<ClientReports />} />
      <Route path="/client/portfolio" element={<ClientPortfolio />} />
      <Route path="/client/metrics" element={<ClientMetrics />} />
      <Route path="/client/files" element={<ClientFiles />} />
      <Route path="/client/my-rep" element={<ClientMyRep />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppRouter() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<SignIn />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (user.role === "client") return <ClientRouter />;

  return <SalesRepRouter />;
}

function App() {
  return (
    <AuthProvider>
      <ClientsProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </ClientsProvider>
    </AuthProvider>
  );
}

export default App;
