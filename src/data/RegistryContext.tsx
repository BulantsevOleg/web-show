export * from "./RegistryProvider";

// import React from "react";
// import type { Registry } from "../types/registry";
// import { fetchRegistry } from "../services/registry";

// type Ctx = {
//   data: Registry | null;
//   loading: boolean;
//   error: string | null;
// };

// const RegistryContext = React.createContext<Ctx>({
//   data: null,
//   loading: true,
//   error: null,
// });

// export function RegistryProvider({ children }: { children: React.ReactNode }) {
//   const [data, setData] = React.useState<Registry | null>(null);
//   const [loading, setLoading] = React.useState(true);
//   const [error, setError] = React.useState<string | null>(null);

//   React.useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         const reg = await fetchRegistry();
//         if (mounted) setData(reg);
//       } catch (e: any) {
//         if (mounted) setError(String(e?.message || e));
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     })();
//     return () => {
//       mounted = false;
//     };
//   }, []);

//   return (
//     <RegistryContext.Provider value={{ data, loading, error }}>
//       {children}
//     </RegistryContext.Provider>
//   );
// }

// export function useRegistry() {
//   return React.useContext(RegistryContext);
// }
