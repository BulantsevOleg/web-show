// src/types/registry.ts
export type { Site, Article, Item, Brand, Registry } from "../schema/registry";

// export type Registry = {
//   site: Site;
//   brands: Record<string, Brand>;
// };

// export type Site = {
//   hanifaLogo?: string;
//   heroNote?: string;
//   telegramIcon?: string;
//   telegramLink?: string;
//   footerNote?: string;
//   brandsOrder?: string[];
// };

// export type Brand = {
//   homeLogoBase?: string;
//   homeLogoHover?: string;
//   brandLogo?: string;
//   items: Item[];
// };

// export type Item = {
//   id: string;
//   name: string;
//   slug: string;
//   baseImage?: string;
//   hoverImage?: string;
//   article?: Article;
// };

// export type Article = {
//   blocks?: string[];       // текстовые блоки
//   images?: string[];       // ссылки на 3:4 и 3:2
//   wbLink?: string;         // ссылка на магазин
//   tocBefore2?: string;     // заголовок перед блоком 2
//   tocBefore6?: string;     // заголовок перед блоком 6
// };
