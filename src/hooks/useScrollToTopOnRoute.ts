// src/hooks/useScrollToTopOnRoute.ts
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useScrollToTopOnRoute() {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    if (hash) return;           // если якорь — не трогаем
    window.scrollTo(0, 0);
  }, [pathname, search, hash]);
}
