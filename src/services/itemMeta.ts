import { ItemMetaSchema, type ItemMeta } from "../types/itemMeta";

const cache = new Map<string, ItemMeta>();

export async function fetchItemMeta(slug: string): Promise<ItemMeta> {
  const key = (slug || "").toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const url = `/CONTENT/SKU PAGE/${encodeURIComponent(key)}/meta.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`meta.json ${key} HTTP ${res.status}`);

  const json = await res.json();
  const parsed = ItemMetaSchema.parse(json);
  cache.set(key, parsed);
  return parsed;
}
