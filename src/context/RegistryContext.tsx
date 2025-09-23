import React from "react";
import type { Registry } from "../types/registry";
import { fetchRegistry } from "../services/registry";

type RegistryState = {
  data: Registry | null;
  loading: boolean;
  error: string | null;
};

const RegistryContext = React.createContext<RegistryState>({
  data: null,
  loading: true,
  error: null,
});

export function RegistryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<RegistryState>({
    data: null,
    loading: true,
    error: null,
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const reg = await fetchRegistry();
        if (!cancelled) setState({ data: reg, loading: false, error: null });
      } catch (e: any) {
        if (!cancelled)
          setState({
            data: null,
            loading: false,
            error: e?.message || "Ошибка загрузки",
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <RegistryContext.Provider value={state}>{children}</RegistryContext.Provider>
  );
}

export function useRegistry() {
  return React.useContext(RegistryContext);
}
