import type { Registry, Item } from "../types/registry";
import { slugify } from "./slug";

export function getItemByBrandAndSlug(
  reg: Registry,
  brandKey: string,
  slug: string
): Item | null {
  const brand = reg.brands[brandKey];
  if (!brand) return null;

  // 1) точное совпадение по item.slug (если есть)
  let found = brand.items.find((it) => it.slug && it.slug === slug);
  if (found) return found;

  // 2) fallback: slugify(name) === slug
  found = brand.items.find((it) => slugify(it.name) === slug);
  return found || null;
}
