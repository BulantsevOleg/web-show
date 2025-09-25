import { z } from "zod";
import { slugify } from "../utils/slug";

/* ---------------- Site ---------------- */
const SiteSchema = z.object({
  hanifaLogo: z.string().optional(),
  heroNote: z.string().default(""),
  telegramIcon: z.string().optional(),
  telegramLink: z.string().optional(),
  footerNote: z.string().default(""),
  brandsOrder: z.array(z.string()).optional(),
});
export type Site = z.infer<typeof SiteSchema>;

/* --------------- Article -------------- */
const ArticleSchema = z.object({
  blocks: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  wbLink: z.string().optional(),
  tocBefore1: z.string().optional(),
  tocBefore2: z.string().optional(),
  tocBefore5: z.string().optional(),
  tocBefore6: z.string().optional(),
});
export type Article = z.infer<typeof ArticleSchema>;

/* ---------------- Item ---------------- */
const ItemSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, "name is required"),
  slug: z.string().optional(),
  baseImage: z.string().optional(),
  hoverImage: z.string().optional(),
  wbLink: z.string().url().optional(),
  article: ArticleSchema.optional(),
});
export type Item = z.infer<typeof ItemSchema>;

/* ---- Старый формат: словарь айтемов --- */
const ItemLikeSchema = ItemSchema.partial().extend({
  name: z.string().optional(),
});

const BrandInputSchema = z.object({
  brandLogo: z.string().optional(),
  homeLogoBase: z.string().optional(),
  homeLogoHover: z.string().optional(),
  items: z.union([
    z.array(ItemSchema),
    z.record(z.string(), ItemLikeSchema),
  ]).optional(),
});

export type Brand = {
  brandLogo?: string;
  homeLogoBase?: string;
  homeLogoHover?: string;
  items: Item[];
};

const RegistryInputSchema = z.object({
  site: SiteSchema,
  brands: z.record(z.string(), BrandInputSchema),
});

export const RegistrySchema = RegistryInputSchema;

export type Registry = {
  site: Site;
  brands: Record<string, Brand>;
};

/* --------------- Helpers -------------- */
function unslugToName(s: string): string {
  const raw = decodeURIComponent(s || "");
  const spaced = raw.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return spaced.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

/* -- ensure unique slug inside brand ---- */
function ensureUniqueSlug(base: string, taken: Set<string>, fallbackBase = "item"): string {
  const clean = slugify(base) || slugify(fallbackBase);
  let candidate = clean || fallbackBase;
  let n = 2;
  while (!candidate || taken.has(candidate)) {
    candidate = `${clean || fallbackBase}-${n++}`;
  }
  taken.add(candidate);
  return candidate;
}

/* ------------- Normalization ----------- */
export function parseAndNormalizeRegistry(json: unknown): Registry {
  const parsed = RegistryInputSchema.parse(json);

  const out: Registry = {
    site: {
      heroNote: parsed.site.heroNote ?? "",
      footerNote: parsed.site.footerNote ?? "",
      hanifaLogo: parsed.site.hanifaLogo,
      telegramIcon: parsed.site.telegramIcon,
      telegramLink: parsed.site.telegramLink,
      brandsOrder: parsed.site.brandsOrder,
    },
    brands: {},
  };

  for (const brandKey of Object.keys(parsed.brands)) {
    const bIn = parsed.brands[brandKey];

    const itemsArray: Array<z.infer<typeof ItemSchema> | z.infer<typeof ItemLikeSchema>> =
      Array.isArray(bIn.items)
        ? (bIn.items as Array<z.infer<typeof ItemSchema>>)
        : bIn.items
        ? Object.entries(bIn.items).map(([key, it]) => {
            const name = it?.name && it.name.trim() ? it.name : unslugToName(key);
            const slug = it?.slug && it.slug.trim() ? it.slug : key;
            return { ...it, name, slug };
          })
        : [];

    const usedSlugs = new Set<string>();

    const normalizedItems: Item[] = itemsArray.map((it, idx) => {
      const a = (it.article ?? {}) as Partial<Article>;

      const article: Article = {
        blocks: Array.isArray(a.blocks) ? a.blocks : [],
        images: Array.isArray(a.images) ? a.images : [],
        wbLink: a.wbLink ?? it.wbLink ?? undefined,
        tocBefore1: a.tocBefore1 ?? "",
        tocBefore2: a.tocBefore2 ?? "",
        tocBefore5: a.tocBefore5 ?? "",
        tocBefore6: a.tocBefore6 ?? "",
      };

      const rawName = it.name && it.name.trim() ? it.name : `Item ${idx + 1}`;
      const baseSlug = it.slug && it.slug.trim() ? it.slug : rawName;

      const uniqueSlug = ensureUniqueSlug(baseSlug, usedSlugs, `${brandKey}-${idx + 1}`);

      const safeId =
        it.id !== undefined
          ? String(it.id)
          : `${uniqueSlug}-${idx + 1}`;

      return {
        id: safeId,
        name: rawName,
        slug: uniqueSlug,
        baseImage: it.baseImage,
        hoverImage: it.hoverImage,
        wbLink: it.wbLink,
        article,
      };
    });

    const brand: Brand = {
      brandLogo: bIn.brandLogo,
      homeLogoBase: bIn.homeLogoBase,
      homeLogoHover: bIn.homeLogoHover,
      items: normalizedItems,
    };

    out.brands[brandKey] = brand;
  }

  return out;
}

// // src/schema/registry.ts
// import { z } from "zod";
// import { slugify } from "../utils/slug";

// /* ---------------- Site ---------------- */

// const SiteSchema = z.object({
//   hanifaLogo: z.string().optional(),
//   heroNote: z.string().default(""),
//   telegramIcon: z.string().optional(),
//   telegramLink: z.string().optional(),
//   footerNote: z.string().default(""),
//   brandsOrder: z.array(z.string()).optional(),
// });
// export type Site = z.infer<typeof SiteSchema>;

// /* --------------- Article -------------- */

// const ArticleSchema = z.object({
//   blocks: z.array(z.string()).default([]),
//   images: z.array(z.string()).default([]),
//   wbLink: z.string().optional(),
//   tocBefore2: z.string().optional(),
//   tocBefore6: z.string().optional(),
// });
// export type Article = z.infer<typeof ArticleSchema>;

// /* ---------------- Item ---------------- */

// const ItemSchema = z.object({
//   // разрешаем строку/число/отсутствие
//   id: z.union([z.string(), z.number()]).optional(),
//   name: z.string().min(1, "name is required"),
//   slug: z.string().optional(),
//   baseImage: z.string().optional(),
//   hoverImage: z.string().optional(),
//   wbLink: z.string().url().optional(),
//   article: ArticleSchema.optional(),
// });
// export type Item = z.infer<typeof ItemSchema>;

// /* --------- Входной формат бренда ------ */
// /** В старой версии items могли быть не массивом, а объектом. */
// const ItemLikeSchema = ItemSchema.partial().extend({
//   // name в объектном формате мог отсутствовать — допустим
//   name: z.string().optional(),
// });

// const BrandInputSchema = z.object({
//   brandLogo: z.string().optional(),
//   homeLogoBase: z.string().optional(),
//   homeLogoHover: z.string().optional(),
//   // КЛЮЧЕВОЕ: items — либо массив, либо словарь
//   items: z.union([
//     z.array(ItemSchema),
//     z.record(z.string(), ItemLikeSchema),
//   ]).optional(),
// });

// /* --------- Нормализованный бренд ------ */
// /** Финально в приложении всегда Brand.items: Item[] */
// export type Brand = {
//   brandLogo?: string;
//   homeLogoBase?: string;
//   homeLogoHover?: string;
//   items: Item[];
// };

// /* --------- Входной реестр и вывод ----- */

// const RegistryInputSchema = z.object({
//   site: SiteSchema,
//   brands: z.record(z.string(), BrandInputSchema),
// });

// /** Для совместимости, если где-то импортировали RegistrySchema */
// export const RegistrySchema = RegistryInputSchema;

// export type Registry = {
//   site: Site;
//   brands: Record<string, Brand>;
// };

// /* --------------- Helpers -------------- */

// function unslugToName(s: string): string {
//   const raw = decodeURIComponent(s || "");
//   const spaced = raw.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
//   // Первая буква каждого слова — заглавная
//   return spaced.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
// }

// /* ------------- Normalization ----------- */

// export function parseAndNormalizeRegistry(json: unknown): Registry {
//   const parsed = RegistryInputSchema.parse(json);

//   const out: Registry = {
//     site: {
//       heroNote: parsed.site.heroNote ?? "",
//       footerNote: parsed.site.footerNote ?? "",
//       hanifaLogo: parsed.site.hanifaLogo,
//       telegramIcon: parsed.site.telegramIcon,
//       telegramLink: parsed.site.telegramLink,
//       brandsOrder: parsed.site.brandsOrder,
//     },
//     brands: {},
//   };

//   for (const brandKey of Object.keys(parsed.brands)) {
//     const bIn = parsed.brands[brandKey];

//     // Приводим items к массиву
//     const itemsArray: Array<z.infer<typeof ItemSchema> | z.infer<typeof ItemLikeSchema>> =
//       Array.isArray(bIn.items)
//         ? (bIn.items as Array<z.infer<typeof ItemSchema>>)
//         : bIn.items
//         ? Object.entries(bIn.items).map(([key, it]) => {
//             // если в словаре нет name — получаем его из ключа
//             const name = it?.name && it.name.trim() ? it.name : unslugToName(key);
//             // если нет slug — берём ключ
//             const slug = it?.slug && it.slug.trim() ? it.slug : key;
//             return { ...it, name, slug };
//           })
//         : [];

//     // Нормализуем каждый айтем
//     const normalizedItems: Item[] = itemsArray.map((it, idx) => {
//       const a = (it.article ?? {}) as Partial<Article>;

//       const article: Article = {
//         blocks: Array.isArray(a.blocks) ? a.blocks : [],
//         images: Array.isArray(a.images) ? a.images : [],
//         wbLink: a.wbLink ?? it.wbLink ?? undefined,
//         tocBefore2: a.tocBefore2 ?? "",
//         tocBefore6: a.tocBefore6 ?? "",
//       };

//       const safeSlug =
//         (it.slug && it.slug.trim()) ? slugify(it.slug) : slugify(it.name ?? "");

//       const safeId =
//         it.id !== undefined
//           ? String(it.id)
//           : safeSlug || `${slugify(brandKey)}-${idx}`;

//       const name =
//         it.name && it.name.trim() ? it.name : unslugToName(safeSlug || `item-${idx}`);

//       return {
//         id: safeId,
//         name,
//         slug: safeSlug,
//         baseImage: it.baseImage,
//         hoverImage: it.hoverImage,
//         wbLink: it.wbLink, // уже сведён в article.wbLink, но сохраняем поле если было
//         article,
//       };
//     });

//     const brand: Brand = {
//       brandLogo: bIn.brandLogo,
//       homeLogoBase: bIn.homeLogoBase,
//       homeLogoHover: bIn.homeLogoHover,
//       items: normalizedItems,
//     };

//     out.brands[brandKey] = brand;
//   }

//   return out;
// }

// // // src/schema/registry.ts
// // import { z } from "zod";
// // import { slugify } from "../utils/slug";

// // const SiteSchema = z.object({
// //   hanifaLogo: z.string().optional(),
// //   heroNote: z.string().default(""),
// //   telegramIcon: z.string().optional(),
// //   telegramLink: z.string().optional(),
// //   footerNote: z.string().default(""),
// //   brandsOrder: z.array(z.string()).optional(),
// // });

// // const ArticleSchema = z.object({
// //   blocks: z.array(z.string()).default([]),
// //   images: z.array(z.string()).default([]),
// //   wbLink: z.string().optional(),
// //   tocBefore2: z.string().optional(),
// //   tocBefore6: z.string().optional(),
// // });

// // const ItemSchema = z.object({
// //   // Разрешаем и строку, и число, и отсутствие поля
// //   id: z.union([z.string(), z.number()]).optional(),
// //   name: z.string(),
// //   slug: z.string().optional(),
// //   baseImage: z.string().optional(),
// //   hoverImage: z.string().optional(),
// //   wbLink: z.string().url().optional(),
// //   article: ArticleSchema.optional(),
// // });


// // const BrandSchema = z.object({
// //   brandLogo: z.string().optional(),
// //   homeLogoBase: z.string().optional(),
// //   homeLogoHover: z.string().optional(),
// //   items: z.array(ItemSchema),
// // });

// // export const RegistrySchema = z.object({
// //   site: SiteSchema,
// //   // ВАЖНО: два аргумента — ключи и значение
// //   brands: z.record(z.string(), BrandSchema),
// // });

// // // Типы из схем
// // export type Site = z.infer<typeof SiteSchema>;
// // export type Article = z.infer<typeof ArticleSchema>;
// // export type Item = z.infer<typeof ItemSchema>;
// // export type Brand = z.infer<typeof BrandSchema>;
// // export type Registry = z.infer<typeof RegistrySchema>;

// // // Нормализация: аккуратно приводим данные к ожидаемому виду
// // export function parseAndNormalizeRegistry(json: unknown): Registry {
// //   const parsed = RegistrySchema.parse(json);
// //   // Делаем копию, чтобы иметь возможность модифицировать
// //   const out: Registry = {
// //     site: {
// //       heroNote: parsed.site.heroNote ?? "",
// //       footerNote: parsed.site.footerNote ?? "",
// //       hanifaLogo: parsed.site.hanifaLogo,
// //       telegramIcon: parsed.site.telegramIcon,
// //       telegramLink: parsed.site.telegramLink,
// //       brandsOrder: parsed.site.brandsOrder,
// //     },
// //     brands: { ...parsed.brands },
// //   };

// //   // Проходим по брендам
// //   for (const brandKey of Object.keys(out.brands)) {
// //     const brand = out.brands[brandKey]; // тип: Brand

// //     // Карта айтемов с нормализацией
// //     brand.items = brand.items.map((it): Item => {
// //       // дайте корректный тип, чтобы у a были опциональные поля Article
// //       const a: Partial<Article> = it.article ?? {};

// //       const onArticle: Article = {
// //         blocks: Array.isArray(a.blocks) ? a.blocks : [],
// //         images: Array.isArray(a.images) ? a.images : [],
// //         wbLink: a.wbLink ?? it.wbLink ?? undefined,
// //         tocBefore2: a.tocBefore2 ?? "",
// //         tocBefore6: a.tocBefore6 ?? "",
// //       };

// //       const slug = it.slug && it.slug.trim() ? it.slug : slugify(it.name);

// //       return {
// //         ...it,
// //         slug,
// //         article: onArticle,
// //       };
// //     });
// //   }

// //   return out;
// // }
