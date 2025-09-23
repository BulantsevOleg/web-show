  // Лёгкий префетч изображений + целевого набора с ограничением по количеству

export function prefetchImage(url?: string): Promise<void> {
    return new Promise((resolve) => {
      if (!url) return resolve();
      const img = new Image();
      img.onload = img.onerror = () => resolve();
      img.decoding = "async";
      img.referrerPolicy = "no-referrer"; // безопасно для бакета
      img.src = url;
    });
  }
  
  export async function prefetchMany(urls: (string | undefined)[], limit = 12): Promise<void> {
    // Не тянем всё подряд, только первые N
    const slice = urls.filter(Boolean).slice(0, limit) as string[];
    await Promise.all(slice.map((u) => prefetchImage(u)));
  }
  
  /**
   * Динамически вставляет <link rel="preload" as="image"> для первых N изображений.
   * Возвращает функцию очистки, которая удалит добавленные теги при анмаунте.
   */
  export function injectPreloadLinks(urls: (string | undefined)[], limit = 4): () => void {
    const created: HTMLLinkElement[] = [];
    const slice = urls.filter(Boolean).slice(0, limit) as string[];
    slice.forEach((href) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      document.head.appendChild(link);
      created.push(link);
    });
    return () => {
      created.forEach((l) => l.remove());
    };
  }
  