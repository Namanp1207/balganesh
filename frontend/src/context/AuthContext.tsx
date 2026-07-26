import { createContext, useContext, useState, ReactNode } from "react";
import api from "../api/axios";

interface AuthContextType {
  email: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(localStorage.getItem("bg_email"));
  const [token, setToken] = useState<string | null>(localStorage.getItem("bg_token"));

  const login = async (emailInput: string, password: string) => {
    const res = await api.post("/auth/login", { email: emailInput, password });
    localStorage.setItem("bg_token", res.data.token);
    localStorage.setItem("bg_email", res.data.email);
    setToken(res.data.token);
    setEmail(res.data.email);
  };

  const logout = () => {
    localStorage.removeItem("bg_token");
    localStorage.removeItem("bg_email");
    setToken(null);
    setEmail(null);
  };

  return (
    <AuthContext.Provider value={{ email, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
