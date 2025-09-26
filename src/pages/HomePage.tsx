import React from "react";
import { Link } from "react-router-dom";
import { useRegistry } from "../data/RegistryProvider";
// import { brandPath } from "../router/paths";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { prefetchMany } from "../utils/prefetch";
import { assetUrl } from "../utils/assets";


export function HomePage() {
  useDocumentTitle("HANIFA MARKET");
  const { data } = useRegistry();
  if (!data) return null;

  const site = data.site;
  const brands = data.brands;
  const order = site.brandsOrder || Object.keys(brands);

  const BrandLogo = ({ brandKey }: { brandKey: string }) => {
    const b = brands[brandKey];
  
    // предзагружаем hover, чтобы не мигало
    React.useEffect(() => {
      if (!b?.homeLogoHover) return;
      const img = new Image();
      img.decoding = "async";
      img.src = assetUrl(b.homeLogoHover);
    }, [b?.homeLogoHover]);
  
    // префетч сетки товара бренда
    const prefetchBrandBase = React.useCallback(() => {
      const items = data.brands[brandKey]?.items || [];
      const urls = items.map((it) => it.baseImage);
      prefetchMany(urls, 12);
    }, [brandKey]);
  
    return (
      <Link to={`/catalog/${encodeURIComponent(brandKey.toUpperCase())}`}>
        <div
          className="relative aspect-[16/9] overflow-hidden w-[86vw] md:w-[34vw] max-w-[560px] group"
          onMouseEnter={prefetchBrandBase}
          onFocus={prefetchBrandBase}
          onTouchStart={prefetchBrandBase}
          onPointerEnter={prefetchBrandBase}
        >
          {/* base */}
          <img
            src={assetUrl(b.homeLogoBase) || ""}
            alt={brandKey}
            className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-0"
          />
          {/* hover поверх base */}
          {b?.homeLogoHover && (
            <img
              src={assetUrl(b.homeLogoHover)}
              alt={`${brandKey} hover`}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 opacity-0 group-hover:opacity-100 pointer-events-none"
            />
          )}
        </div>
      </Link>
    );
  };
  
  

  return (
    <div className="min-h-screen grid grid-rows-[auto,1fr,auto,1fr,auto,auto]">
      {/* Row 1: HANIFA MARKET logo */}
      <div className="w-full flex justify-center pt-6 md:pt-8">
        <div className="h-16 md:h-20 flex items-center justify-center">
          {site.hanifaLogo && (
            <img
              src={assetUrl(site.hanifaLogo)}
              alt="HANIFA MARKET"
              className="h-full w-auto object-contain"
              decoding="async"
            />
          )}
        </div>
      </div>

      <div></div>

      {/* Row 3: note + brand logos */}
      <div className="flex flex-col items-center w-full">
        {/* единая полоса-шапка */}
        <div className="relative w-full mt-6 h-10 md:h-12 flex items-center justify-center">
          <div className="text-base md:text-lg text-center opacity-80 px-4 whitespace-nowrap">
            {site.heroNote}
          </div>
        </div>
        {/* сетка брендов — чуть подвинем, уберём «скачок» от относительного сдвига */}
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-10 mt-6">
          {order.map((brandKey) => (
            <BrandLogo key={brandKey} brandKey={brandKey} />
          ))}
        </div>
      </div>

      <div></div>

      {/* Row 5: Telegram icon */}
      <div className="w-full flex flex-col items-center relative top-2 md:top-8">
        {site.telegramLink && site.telegramIcon && (
          <a
            href={site.telegramLink}
            target="_blank"
            rel="noreferrer"
            className="inline-block transition-transform duration-300 hover:scale-110"
          >
            <img
              src={assetUrl(site.telegramIcon)}
              alt="Telegram"
              className="w-32 h-32 md:w-40 md:h-40 object-contain"
            />
          </a>
        )}
      </div>



      {/* Row 6: caption */}
      <div className="w-full flex justify-center mb-8 md:mb-12">
        <div className="text-base md:text-lg text-center opacity-80 px-6 leading-tight mt-4 md:mt-6">
          <span className="block whitespace-pre-line">{data.site.footerNote}</span>
        </div>
      </div>
    </div>
  );
}

// import React from "react";
// import type { Registry } from "../types/registry";



// export function HomePage({ data }: { data: Registry }) {
//   const site = data.site;
//   const brands = data.brands;
//   const order = site.brandsOrder && site.brandsOrder.length
//     ? site.brandsOrder
//     : Object.keys(brands);

//   const BrandLogo: React.FC<{ brandKey: string }> = ({ brandKey }) => {
//     const b = brands[brandKey];
//     const [src, setSrc] = React.useState(b.homeLogoBase);
//     return (
//       <a href={`#/brand/${encodeURIComponent(brandKey)}`} className="block transition-all">
//         <div className="relative aspect-[16/9] overflow-hidden w-[86vw] md:w-[34vw] max-w-[560px]">
//           <img
//             src={src || b.homeLogoBase}
//             alt={brandKey}
//             className="w-full h-full object-cover"
//             onMouseEnter={() => b.homeLogoHover && setSrc(b.homeLogoHover)}
//             onMouseLeave={() => setSrc(b.homeLogoBase)}
//           />
//         </div>
//       </a>
//     );
//   };

//   return (
//     <div className="min-h-screen grid grid-rows-[auto,1fr,auto,1fr,auto,auto]">
//       {/* Row 1: логотип */}
//       <div className="w-full flex justify-center pt-6 md:pt-8">
//         {site.hanifaLogo && (
//           <img
//             src={site.hanifaLogo}
//             alt="HANIFA MARKET"
//             className="object-contain max-w-[420px] w-[22vw] min-w-[260px]"
//           />
//         )}
//       </div>

//       <div></div>

//       {/* Row 3: подпись + бренды */}
//       <div className="flex flex-col items-center w-full">
//         <div className="text-base md:text-lg text-center mt-6 opacity-80 px-4 leading-tight whitespace-nowrap">
//           {site.heroNote || "Выбери бренд своего предмета гардероба:"}
//         </div>
//         <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-10 mt-6 relative top-2 md:top-3">
//           {order.map((brandKey) => (
//             <BrandLogo key={brandKey} brandKey={brandKey} />
//           ))}
//         </div>
//       </div>

//       <div></div>

//       {/* Row 5: Telegram */}
//       <div className="w-full flex flex-col items-center relative top-2 md:top-8">
//         {site.telegramLink && site.telegramIcon && (
//           <a href={site.telegramLink} target="_blank" className="transition-transform hover:scale-105">
//             <img src={site.telegramIcon} alt="Telegram" className="w-32 h-32 md:w-40 md:h-40 object-contain" />
//           </a>
//         )}
//       </div>

//       {/* Row 6: подпись под TG */}
//       <div className="w-full flex justify-center mb-8 md:mb-12">
//         <div className="text-base md:text-lg text-center opacity-80 px-6 leading-tight mt-4 md:mt-6">
//           <span className="block">В чате мы можем собрать тебе лук</span>
//           <span className="block">или помочь разрешить любую проблему.</span>
//         </div>
//       </div>
//     </div>
//   );
// }
