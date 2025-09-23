// src/data/RegistryProvider.tsx
import React from "react";
import type { Registry } from "../types/registry";
import { parseAndNormalizeRegistry } from "../schema/registry";
import { normalizeEtag } from "../utils/etag";

async function safeHeadEtag(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-cache" });
    if (!res.ok) return null;
    const raw = normalizeEtag(res.headers.get("etag"));
    return raw ? raw.replace(/"/g, "") : null; // S3 возвращает в кавычках — снимаем
  } catch {
    // Нек-рые статики/прокси не пускают HEAD — не считаем ошибкой
    return null;
  }
}

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/** Читает registry.json с приоритетом URL из .env (S3), иначе — локальные пути. */
async function fetchRegistryWithFallback(): Promise<{
  data: Registry;
  etag: string | null;
  urlUsed: string;
}> {
  const envUrl = (import.meta.env.VITE_REGISTRY_URL as string | undefined)?.trim();
  const candidates = envUrl && /^https?:\/\//i.test(envUrl)
    ? [envUrl] // 1) S3 из .env — приоритет
    : ["/registry.json", "/CONTENT/registry.json"]; // 2) локальные бэкапы

  let lastErr: unknown = null;

  for (const url of candidates) {
    try {
      const [etag, json] = await Promise.all([
        safeHeadEtag(url),         // HEAD может вернуть null — это ок
        fetchJson(url),            // основной запрос
      ]);
      const data = parseAndNormalizeRegistry(json);
      return { data, etag, urlUsed: url };
    } catch (e) {
      lastErr = e;
      // пробуем следующий кандидат
    }
  }
  throw lastErr ?? new Error("Не удалось загрузить registry.json ни по одному пути");
}

type Ctx = {
  data: Registry | null;
  loading: boolean;
  error: string | null;
  etag: string | null;
  urlUsed: string | null;
  refresh: () => Promise<void>;
};

const RegistryContext = React.createContext<Ctx | null>(null);

export function RegistryProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<Registry | null>(null);
  const [etag, setEtag] = React.useState<string | null>(null);
  const [urlUsed, setUrlUsed] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRegistryWithFallback();
      setData(res.data);
      setEtag(res.etag);
      setUrlUsed(res.urlUsed);
    } catch (e: any) {
      setError(String(e?.message || e));
      setData(null);
      setEtag(null);
      setUrlUsed(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const value: Ctx = { data, loading, error, etag, urlUsed, refresh: load };

  return <RegistryContext.Provider value={value}>{children}</RegistryContext.Provider>;
}

export function useRegistry() {
  const ctx = React.useContext(RegistryContext);
  if (!ctx) throw new Error("useRegistry must be used within RegistryProvider");
  return ctx;
}

// // src/data/RegistryProvider.tsx
// import React from "react";
// import type { Registry } from "../types/registry";
// import { parseAndNormalizeRegistry } from "../schema/registry";

// /**
//  * Читает ETag через HEAD (если доступен/CORS разрешён),
//  * затем тянет сам JSON. Возвращает нормализованные данные + etag + фактический URL.
//  */
// async function fetchJsonWithEtag(url: string): Promise<{
//   data: Registry;
//   etag: string | null;
//   urlUsed: string;
// }> {
//   let etag: string | null = null;

//   // Пытаемся взять ETag HEAD-запросом (на S3/YC Object Storage работает; в dev — может не вернуться, это ок)
//   try {
//     const head = await fetch(url, { method: "HEAD", cache: "no-cache" });
//     if (head.ok) {
//       const raw = head.headers.get("etag");
//       etag = raw ? raw.replace(/"/g, "") : null; // убираем кавычки
//     }
//   } catch {
//     // игнорим — пойдём дальше без ETag
//   }

//   // Основной GET
//   const res = await fetch(url, { cache: "no-store" });
//   if (!res.ok) {
//     // если 404 — пусть наверху решат пробовать следующий кандидат
//     if (res.status === 404) {
//       throw Object.assign(new Error("NotFound"), { code: 404 });
//     }
//     throw new Error(`HTTP ${res.status} for ${url}`);
//   }

//   const json = await res.json();
//   const data = parseAndNormalizeRegistry(json);
//   // если ETag не удалось получить HEAD'ом, попробуем вытащить из GET
//   if (!etag) {
//     const raw = res.headers.get("etag");
//     etag = raw ? raw.replace(/"/g, "") : null;
//   }

//   return { data, etag, urlUsed: url };
// }

// /**
//  * Пытаемся прочитать registry.json в порядке:
//  * 1) VITE_REGISTRY_URL (если задан) — это прод/стейдж бакет
//  * 2) /registry.json (локально)
//  * 3) /CONTENT/registry.json (локально)
//  */

// // src/data/RegistryProvider.tsx (фрагмент)
// async function fetchRegistryWithFallback(): Promise<{
//   data: Registry;
//   etag: string | null;
//   urlUsed: string;
// }> {
//   const envUrl = import.meta.env.VITE_REGISTRY_URL as string | undefined;
//   const candidates = envUrl
//     ? [envUrl]                                   // 1) S3 из .env — в приоритете
//     : ["/registry.json", "/CONTENT/registry.json"]; // 2) локальные бэкапы

//   let lastErr: unknown = null;

//   for (const url of candidates) {
//     try {
//       // Попробуем HEAD, чтобы гарантированно взять ETag с источника
//       const head = await fetch(url, { method: "HEAD", cache: "no-cache" });
//       // HEAD не всегда доступен (локальный dev) — не считаем это фаталом
//       const raw = head.ok ? head.headers.get("etag") : null;
//       const etag = raw ? raw.replace(/"/g, "") : null;

//       const res = await fetch(url, { cache: "no-cache" });
//       if (!res.ok) {
//         if (res.status === 404) continue;
//         throw new Error(`HTTP ${res.status} for ${url}`);
//       }
//       const json = await res.json();
//       const data = parseAndNormalizeRegistry(json);

//       return { data, etag, urlUsed: url };
//     } catch (e) {
//       lastErr = e;
//     }
//   }
//   throw lastErr ?? new Error("Не удалось загрузить registry.json ни по одному пути");
// }


// type Ctx = {
//   data: Registry | null;
//   loading: boolean;
//   error: string | null;
//   etag: string | null;
//   urlUsed: string | null;
//   /** Принудительно перечитать реестр с сервера */
//   refresh: () => Promise<void>;
// };

// const RegistryContext = React.createContext<Ctx | null>(null);

// export function RegistryProvider({ children }: { children: React.ReactNode }) {
//   const [data, setData] = React.useState<Registry | null>(null);
//   const [etag, setEtag] = React.useState<string | null>(null);
//   const [urlUsed, setUrlUsed] = React.useState<string | null>(null);
//   const [loading, setLoading] = React.useState(true);
//   const [error, setError] = React.useState<string | null>(null);

//   const load = React.useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await fetchRegistryWithFallback();
//       setData(res.data);
//       setEtag(res.etag);
//       setUrlUsed(res.urlUsed);
//     } catch (e: any) {
//       setError(String(e?.message || e));
//       setData(null);
//       setEtag(null);
//       setUrlUsed(null);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   React.useEffect(() => {
//     load();
//   }, [load]);

//   const value: Ctx = {
//     data,
//     loading,
//     error,
//     etag,
//     urlUsed,
//     refresh: load,
//   };

//   return <RegistryContext.Provider value={value}>{children}</RegistryContext.Provider>;
// }

// export function useRegistry() {
//   const ctx = React.useContext(RegistryContext);
//   if (!ctx) throw new Error("useRegistry must be used within RegistryProvider");
//   return ctx;
// }

// // // src/data/RegistryProvider.tsx
// // import React from "react";
// // import type { Registry } from "../types/registry";
// // import { parseAndNormalizeRegistry } from "../schema/registry";


// // /**
// //  * Пытаемся подряд прочитать registry.json сначала из корня,
// //  * если 404 — пробуем /CONTENT/registry.json
// //  * Возвращаем нормализованные данные + ETag + фактический URL, с которого читали.
// //  */
// // async function fetchRegistryWithFallback(): Promise<{
// //   data: Registry;
// //   etag: string | null;
// //   urlUsed: string;
// // }> {
// //   const candidates = ["/registry.json", "/CONTENT/registry.json"];

// //   let lastErr: unknown = null;
// //   for (const url of candidates) {
// //     try {
// //       const res = await fetch(url, { cache: "no-cache" });
// //       if (!res.ok) {
// //         // если 404 — пробуем следующий вариант
// //         if (res.status === 404) continue;
// //         throw new Error(`HTTP ${res.status} for ${url}`);
// //       }
// //       const json = await res.json();
// //       const data = parseAndNormalizeRegistry(json);
// //       const etag = res.headers.get("etag"); // может быть null
// //       return { data, etag, urlUsed: url };
// //     } catch (e) {
// //       lastErr = e;
// //       // идём пробовать следующий URL
// //     }
// //   }
// //   throw lastErr ?? new Error("Не удалось загрузить registry.json ни по одному пути");
// // }

// // type Ctx = {
// //   data: Registry | null;
// //   loading: boolean;
// //   error: string | null;
// //   etag: string | null;
// //   urlUsed: string | null;
// //   /** Принудительно перечитать реестр с сервера */
// //   refresh: () => Promise<void>;
// // };

// // const RegistryContext = React.createContext<Ctx | null>(null);

// // export function RegistryProvider({ children }: { children: React.ReactNode }) {
// //   const [data, setData] = React.useState<Registry | null>(null);
// //   const [etag, setEtag] = React.useState<string | null>(null);
// //   const [urlUsed, setUrlUsed] = React.useState<string | null>(null);
// //   const [loading, setLoading] = React.useState(true);
// //   const [error, setError] = React.useState<string | null>(null);

// //   const load = React.useCallback(async () => {
// //     setLoading(true);
// //     setError(null);
// //     try {
// //       const res = await fetchRegistryWithFallback();
// //       setData(res.data);
// //       setEtag(res.etag);
// //       setUrlUsed(res.urlUsed);
// //     } catch (e: any) {
// //       setError(String(e?.message || e));
// //       setData(null);
// //       setEtag(null);
// //       setUrlUsed(null);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, []);

// //   React.useEffect(() => {
// //     load();
// //   }, [load]);

// //   const value: Ctx = {
// //     data,
// //     loading,
// //     error,
// //     etag,
// //     urlUsed,
// //     refresh: load,
// //   };

// //   return <RegistryContext.Provider value={value}>{children}</RegistryContext.Provider>;
// // }

// // export function useRegistry() {
// //   const ctx = React.useContext(RegistryContext);
// //   if (!ctx) throw new Error("useRegistry must be used within RegistryProvider");
// //   return ctx;
// // }

// // // // src/data/RegistryProvider.tsx
// // // import React from "react";
// // // import type { Registry } from "../types/registry";
// // // import { fetchRegistry } from "../services/registry";

// // // type RegistryContextValue = {
// // //   data: Registry | null;
// // //   loading: boolean;
// // //   error: string | null;
// // //   /** Принудительная перезагрузка registry.json (например, после сохранения через админку) */
// // //   reload: () => Promise<void>;
// // // };

// // // const RegistryContext = React.createContext<RegistryContextValue | undefined>(undefined);

// // // export function RegistryProvider({ children }: { children: React.ReactNode }) {
// // //   // стабильный порядок хуков
// // //   const [data, setData] = React.useState<Registry | null>(null);
// // //   const [loading, setLoading] = React.useState<boolean>(true);
// // //   const [error, setError] = React.useState<string | null>(null);

// // //   const load = React.useCallback(async () => {
// // //     setLoading(true);
// // //     setError(null);
// // //     try {
// // //       const reg = await fetchRegistry(); // внутри уже парс, валидация, нормализация
// // //       setData(reg);
// // //     } catch (e: any) {
// // //       setError(e?.message ? String(e.message) : String(e));
// // //       setData(null);
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   }, []);

// // //   React.useEffect(() => {
// // //     // однократно тянем реестр при монтировании провайдера
// // //     load();
// // //   }, [load]);

// // //   const value = React.useMemo<RegistryContextValue>(
// // //     () => ({ data, loading, error, reload: load }),
// // //     [data, loading, error, load]
// // //   );

// // //   return <RegistryContext.Provider value={value}>{children}</RegistryContext.Provider>;
// // // }

// // // export function useRegistry(): RegistryContextValue {
// // //   const ctx = React.useContext(RegistryContext);
// // //   if (!ctx) {
// // //     throw new Error("useRegistry must be used within <RegistryProvider>");
// // //   }
// // //   return ctx;
// // // }

// // // // // src/data/RegistryProvider.tsx
// // // // import React from "react";
// // // // import type { Registry } from "../types/registry";
// // // // import { fetchRegistry } from "../services/registry";

// // // // type Ctx = {
// // // //   data: Registry | null;
// // // //   loading: boolean;
// // // //   error: string | null;
// // // //   reload: () => void;
// // // // };

// // // // const RegistryCtx = React.createContext<Ctx | undefined>(undefined);

// // // // // небольшой вспомогательный retry с паузой
// // // // async function withRetry<T>(fn: () => Promise<T>, attempts = 2, delayMs = 400): Promise<T> {
// // // //   try {
// // // //     return await fn();
// // // //   } catch (e) {
// // // //     if (attempts <= 0) throw e;
// // // //     await new Promise(r => setTimeout(r, delayMs));
// // // //     return withRetry(fn, attempts - 1, delayMs * 2);
// // // //   }
// // // // }

// // // // export function RegistryProvider({ children }: { children: React.ReactNode }) {
// // // //   const [data, setData] = React.useState<Registry | null>(null);


// // // //   const [loading, setLoading] = React.useState(true);
// // // //   const [error, setError] = React.useState<string | null>(null);

// // // //   const load = React.useCallback(async () => {
// // // //     setLoading(true);
// // // //     setError(null);
// // // //     try {
// // // //       const reg = await withRetry(fetchRegistry, 2);
// // // //       setData(reg);
// // // //     } catch (e: any) {
// // // //       setError(e?.message || String(e));
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   }, []);

// // // //   React.useEffect(() => {
// // // //     load();
// // // //   }, [load]);

// // // //   const value = React.useMemo(
// // // //     () => ({ data, loading, error, reload: load }),
// // // //     [data, loading, error, load]
// // // //   );

// // // //   return <RegistryCtx.Provider value={value}>{children}</RegistryCtx.Provider>;
// // // // }

// // // // export function useRegistry() {
// // // //   const ctx = React.useContext(RegistryCtx);
// // // //   if (!ctx) throw new Error("useRegistry must be used inside <RegistryProvider>");
// // // //   return ctx;
// // // // }

// // // // // import React from "react";
// // // // // import type { Registry } from "../types/registry";
// // // // // import { fetchRegistry } from "../services/registry";

// // // // // type RegistryCtx = {
// // // // //   data: Registry | null;
// // // // //   loading: boolean;
// // // // //   error: unknown;
// // // // //   refresh: () => Promise<void>;
// // // // // };

// // // // // const Ctx = React.createContext<RegistryCtx | null>(null);

// // // // // export function RegistryProvider({ children }: { children: React.ReactNode }) {
// // // // //   const [data, setData] = React.useState<Registry | null>(null);
// // // // //   const [loading, setLoading] = React.useState(true);
// // // // //   const [error, setError] = React.useState<unknown>(null);

// // // // //   const load = React.useCallback(async () => {
// // // // //     setLoading(true);
// // // // //     setError(null);
// // // // //     try {
// // // // //       const reg = await fetchRegistry();
// // // // //       setData(reg);
// // // // //     } catch (e) {
// // // // //       setError(e);
// // // // //     } finally {
// // // // //       setLoading(false);
// // // // //     }
// // // // //   }, []);

// // // // //   React.useEffect(() => {
// // // // //     load();
// // // // //   }, [load]);

// // // // //   const value = React.useMemo(
// // // // //     () => ({ data, loading, error, refresh: load }),
// // // // //     [data, loading, error, load]
// // // // //   );

// // // // //   return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
// // // // // }

// // // // // export function useRegistry() {
// // // // //   const ctx = React.useContext(Ctx);
// // // // //   if (!ctx) throw new Error("useRegistry must be used within RegistryProvider");
// // // // //   return ctx;
// // // // // }
