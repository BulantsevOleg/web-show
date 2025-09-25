// src/types.ts
export type Article = {
    tocBefore1?: string;
    tocBefore2?: string;
    tocBefore5?: string;
    tocBefore6?: string;
    wbLink?: string;
    blocks: string[];   // 7 блоков
    images: string[];   // 7 изображений
  };
  
  export type Item = {
    id: string;
    name: string;
    slug: string;       // попадает в URL
    baseImage?: string;
    hoverImage?: string;
    article: Article;
  };
  
  export type Brand = {
    homeLogoBase?: string;
    homeLogoHover?: string;
    brandLogo?: string;
    items: Item[];
  };
  
  export type Registry = {
    site: {
      hanifaLogo?: string;
      heroNote?: string;
      telegramIcon?: string;
      telegramLink?: string;
      footerNote?: string;
      brandsOrder?: string[];
    };
    brands: Record<string, Brand>;
  };
  