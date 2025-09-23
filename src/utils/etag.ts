// src/utils/etag.ts
export function normalizeEtag(raw: string | null | undefined): string | null {
    if (!raw) return null;
    let s = raw.trim();
    // убираем префикс weak-валидатора
    if (s.startsWith("W/")) s = s.slice(2);
    // снимаем кавычки
    if (s.startsWith(`"`) && s.endsWith(`"`)) s = s.slice(1, -1);
    return s || null;
  }
  