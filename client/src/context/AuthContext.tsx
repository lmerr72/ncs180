import { MOCK_CLIENT_REPS } from "@/data/mock_client_reps";
import { UserProfile } from "@/types/api";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthContextValue {
  user: UserProfile | null;
  isReady: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AUTH_STORAGE_KEY = "ncs180.auth.user";

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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) {
        setIsReady(true);
        return;
      }

      const parsed = JSON.parse(stored) as UserProfile | null;
      if (parsed?.id) {
        setUser(parsed);
      }
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsReady(true);
    }
  }, []);

  function login(username: string, password: string): boolean {
    const match = DUMMY_USERS.find(
      u => u.email === username.trim() && u.password === password
    );
    if (!match) return false;
    const nextUser: UserProfile = {
      id: match.id,
      email: match.email,
      firstName: match.firstName,
      lastName: match.lastName,
      role: match.role,
      title: match.title,
      repId: match.repId,
    };
    setUser(nextUser);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    return true;
  }

  function logout() {
    setUser(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, isReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
