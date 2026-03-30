import { MOCK_CLIENT_REPS } from "@/data/mock_client_reps";
import { UserProfile } from "@/types/api";
import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextValue {
  user: UserProfile | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const DUMMY_USERS: Array<UserProfile & { password: string }> = [
  {
    id: "rep-gordon-m",
    email: "gmarshall@ncs180.com",
    password: "lindsay",
    firstName: "Gordon",
    lastName: "Marshall",
    role: "sales_rep",
    title: "Sales Representative",
    repId: (MOCK_CLIENT_REPS.find(c => c.firstName === 'Gordon' && c.lastName === 'Marshall')).id
  },
  {
    id: "client-kathy-m",
    email: "kmcgee@property.com",
    password: "client",
    firstName: "Kathy",
    lastName: "McGee",
    role: "client",
    title: "Client",
  },
];

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  function login(username: string, password: string): boolean {
    const match = DUMMY_USERS.find(
      u => u.email === username.trim() && u.password === password
    );
    if (!match) return false;
    setUser(match);
    return true;
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
