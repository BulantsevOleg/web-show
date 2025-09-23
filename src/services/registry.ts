// src/services/registry.ts
import { ZodError } from "zod";
import { parseAndNormalizeRegistry, type Registry } from "../schema/registry";

let cache: Registry | null = null;

const CANDIDATES = ["/registry.json", "/CONTENT/registry.json"];

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/+$/, "/");
const REGISTRY_URL = `${BASE}CONTENT/registry.json`;


export async function fetchRegistry(): Promise<Registry> {
  if (cache) return cache;

  let lastErr: unknown = null;
  for (const url of CANDIDATES) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        lastErr = new Error(`${url} HTTP ${res.status}`);
        continue;
      }
      const json = (await res.json()) as Registry;
      if (!json || !json.brands) {
        lastErr = new Error(`${url} имеет некорректную структуру`);
        continue;
      }
      cache = json;
      return json;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Не удалось загрузить registry.json ни по одному пути");
}



// import { ZodError } from "zod";
// import { parseAndNormalizeRegistry, type Registry } from "../schema/registry";

// let cache: Registry | null = null;

// // Работает и в dev, и в preview/prod:
// const REGISTRY_URL = new URL("CONTENT/registry.json", import.meta.env.BASE_URL).toString();

// export async function fetchRegistry(): Promise<Registry> {
//   if (cache) return cache;

//   const res = await fetch(REGISTRY_URL, {
//     cache: import.meta.env.DEV ? "no-cache" : "force-cache",
//   });

//   if (!res.ok) {
//     throw new Error(`registry.json HTTP ${res.status} (${REGISTRY_URL})`);
//   }

//   const json = await res.json();

//   try {
//     const reg = parseAndNormalizeRegistry(json);
//     cache = reg;
//     if (import.meta.env.DEV) (window as any).__REGISTRY__ = reg; // дев-диагностика
//     return reg;
//   } catch (e) {
//     if (e instanceof ZodError) {
//       // делаем сообщение читабельным
//       const issues = e.issues.map(i => ({
//         path: i.path.join("."),
//         message: i.message,
//         expected: (i as any).expected,
//         received: (i as any).received,
//       }));
//       throw new Error("Ошибка в формате registry.json:\n" + JSON.stringify(issues, null, 2));
//     }
//     throw e;
//   }
// }

// // src/services/registry.ts
// import { parseAndNormalizeRegistry, type Registry } from "../schema/registry";

// let cache: Registry | null = null;

// export async function fetchRegistry(): Promise<Registry> {
//   if (cache) return cache;

//   // Относительный путь — будет работать и в dev, и в dist/preview, и на бакете
//   const res = await fetch("./CONTENT/registry.json", { cache: "no-cache" });
//   if (!res.ok) throw new Error(`registry.json HTTP ${res.status}`);

//   const raw = await res.json();
//   const reg = parseAndNormalizeRegistry(raw);

//   cache = reg;
//   return reg;
// }


// // // src/services/registry.ts
// // import type { Registry } from "../types/registry";
// // import { parseAndNormalizeRegistry, type Registry } from "../schema/registry";

// // let cache: Registry | null = null;

// // export async function fetchRegistry(): Promise<Registry> {
// //   if (cache) return cache;

// //   // относительный путь — работает и в dev и в prod (dist/)
// //   const res = await fetch("./CONTENT/registry.json", { cache: "no-cache" });
// //   if (!res.ok) throw new Error(`registry.json HTTP ${res.status}`);

// //   const raw = await res.json();
// //   const reg = parseAndNormalizeRegistry(raw);

// //   cache = reg;
// //   return reg;
// // }
