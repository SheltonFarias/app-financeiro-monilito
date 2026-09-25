import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";
import { getToken, login as loginApi, logout as logoutApi } from "@/lib/api";

type AuthContextValue = { ready: boolean; authenticated: boolean; login: (senha: string) => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => { getToken().then(token => setAuthenticated(Boolean(token))).finally(() => setReady(true)); }, []);
  return <AuthContext.Provider value={{ ready, authenticated, login: async senha => { await loginApi(senha); setAuthenticated(true); }, logout: async () => { await logoutApi(); setAuthenticated(false); } }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve estar dentro de AuthProvider.");
  return context;
}
