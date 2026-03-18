import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "sales_rep" | "client";

export interface AuthUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  title?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const DUMMY_USERS: Array<AuthUser & { password: string }> = [
  {
    id: "rep-gordon-m",
    username: "gmarshall",
    password: "lindsay",
    firstName: "Gordon",
    lastName: "Marshall",
    role: "sales_rep",
    title: "Sales Representative",
  },
  {
    id: "client-kathy-m",
    username: "kmcgee",
    password: "client",
    firstName: "Kathy",
    lastName: "McGee",
    role: "client",
    title: "Client",
  },
];

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  function login(username: string, password: string): boolean {
    const match = DUMMY_USERS.find(
      u => u.username === username.trim() && u.password === password
    );
    if (!match) return false;
    const { password: _pw, ...authUser } = match;
    setUser(authUser);
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
