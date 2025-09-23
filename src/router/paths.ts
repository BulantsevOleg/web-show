// src/router/paths.ts
export const brandPath = (brand: string) =>
    `/brand/${encodeURIComponent(brand)}`;
  
export const itemPath = (brand: string, slug: string) =>
  `/brand/${encodeURIComponent(brand)}/item/${encodeURIComponent(slug)}`;