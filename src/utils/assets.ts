export function assetUrl(p?: string | null): string {
    if (!p) return "";
    // Если уже абсолютный URL — отдаем как есть
    if (/^https?:\/\//i.test(p)) return p;
    // На dev подменяем на бакет
    const isDevLocalhost = location.hostname === "localhost";
    const bucketBase = (import.meta.env.VITE_BUCKET_BASE || "").replace(/\/$/, "");
    return isDevLocalhost && bucketBase ? `${bucketBase}/${p}` : p;
  }
  
  