// src/data/AdminContext.tsx
import React from "react";
import { adminLogin } from "../services/adminApi"; // проверь относительный путь

type AdminCtx = {
  token: string | null;
  login: (t: string) => Promise<void>;
  logout: () => void;
};

const Ctx = React.createContext<AdminCtx | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(() =>
    sessionStorage.getItem("adminToken")
  );

  const login = async (t: string) => {
    const ok = await adminLogin(t);       // сервер валидирует токен
    sessionStorage.setItem("adminToken", ok);
    setToken(ok);
  };

  const logout = () => {
    sessionStorage.removeItem("adminToken");
    setToken(null);
  };

  // ⬇️ ВОТ ЭТОТ ЭФФЕКТ — СРАЗУ ПОСЛЕ logout, ДО return
  React.useEffect(() => {
    const h = () => logout();
    window.addEventListener("admin:unauthorized", h);
    return () => window.removeEventListener("admin:unauthorized", h);
  }, [logout]); // пустые deps — подписка один раз

  return <Ctx.Provider value={{ token, login, logout }}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
