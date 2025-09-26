import React from "react";
import { useParams, Link } from "react-router-dom";
import { useRegistry } from "../data/RegistryProvider";
import { slugify } from "../utils/slug";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { assetUrl } from "../utils/assets";

/** небольшая утилита: префетч одной картинки */
function prefetch(src?: string) {
  if (!src) return;
  const img = new Image();
  img.decoding = "async";
  img.src = assetUrl(src);
}

export function BrandPage() {
  const { data, loading, error } = useRegistry();
  const { brand = "" } = useParams<{ brand: string }>();

  if (loading) return <div className="p-6">Загрузка…</div>;
  if (error)   return <div className="p-6 text-red-600">Ошибка: {String(error)}</div>;
  if (!data)   return <div className="p-6">Нет данных.</div>;

  const brandKey = decodeURIComponent(brand).toUpperCase();
  const brandData = data.brands[brandKey];
  useDocumentTitle(`${brandKey} — HANIFA MARKET`);
  if (!brandData) return <div className="p-6">Бренд не найден.</div>;

  // Тизер: через 3 сек показать hover на 4-й карточке на 2 сек
  const [teaseIndex, setTeaseIndex] = React.useState<number | null>(null);
  React.useEffect(() => {
    // префетчим все hover, чтобы переход был мгновенный
    brandData.items.forEach(i => prefetch(i.hoverImage));

    const showTimer = window.setTimeout(() => {
      // индекс 3 → четвёртая карточка, только если она есть и у неё есть hover
      if (brandData.items[3]?.hoverImage) {
        setTeaseIndex(3);
        // скрыть через 2 сек
        const hideTimer = window.setTimeout(() => setTeaseIndex(null), 1000);
        return () => window.clearTimeout(hideTimer);
      }
    }, 1500);

    return () => window.clearTimeout(showTimer);
  }, [brandKey, brandData.items]);

  return (
    <div className="min-h-full flex flex-col">
      {/* Логотип бренда */}
      <div className="pt-8 md:pt-12 flex flex-col items-center">
        <div className="w-full flex items-center justify-center">
          <div className="h-16 md:h-20 flex items-center justify-center">
            {brandData.brandLogo && (
              <img
                src={assetUrl(brandData.brandLogo)}
                alt={brandKey}
                className="h-full w-auto object-contain"
                decoding="async"
              />
            )}
          </div>
        </div>


        <div className="relative w-full mt-6 h-10 md:h-12 flex items-center justify-center">
          <Link
            to="/"
            className="absolute left-5 md:left-10 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 text-xs md:text-sm opacity-70 hover:opacity-100 z-10"
          >
            <span className="text-lg leading-none">←</span>
            <span>назад</span>
          </Link>

          <div className="text-base md:text-lg text-center opacity-80 px-4 whitespace-nowrap">
            Выбери свой предмет гардероба
          </div>
        </div>

      </div>

      {/* Сетка товаров */}
      <div className="flex-1 mt-6 md:mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {brandData.items.map((item, idx) => {
            const routeSlug = item.slug || slugify(item.name);
            return (
              <Link
                key={`${brandKey}:${routeSlug}`}
                to={`/catalog/${encodeURIComponent(brandKey)}/${encodeURIComponent(routeSlug.toUpperCase())}`}
                className="relative block group"
              >
                <div className="aspect-[3/4] w-full bg-white overflow-hidden">
                  <BrandCardImage
                    base={item.baseImage}
                    hover={item.hoverImage}
                    alt={item.name}
                    label={item.name}
                    tease={teaseIndex === idx}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Карточка: кроссфейд base/hover + лёгкий зум на hover/tease */
function BrandCardImage({
  base,
  hover,
  alt,
  label,
  tease = false,
}: {
  base?: string;
  hover?: string;
  alt?: string;
  label?: string;
  tease?: boolean;
}) {
  const [isHovering, setIsHovering] = React.useState(false);

  const showHover = (hover && (isHovering || tease)) ? true : false;

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={() => setIsHovering(true)}
      onTouchEnd={() => setIsHovering(false)}
    >
      {/* base */}
      <img
        src={assetUrl(base)}
        alt={alt}
        className={
          "absolute inset-0 w-full h-full object-cover transition-opacity duration-400 " +
          (showHover ? "opacity-0" : "opacity-100")
        }
        draggable={false}
      />
      {/* hover */}
      {hover && (
        <img
          src={assetUrl(hover)}
          alt={alt ? `${alt} — hover` : "hover"}
          className={
            "absolute inset-0 w-full h-full object-cover transition-all duration-400 " +
            (showHover ? "opacity-100 scale-[1.015]" : "opacity-0 scale-100")
          }
          draggable={false}
        />
      )}

      {/* подпись */}
      {label && (
        <div
          // className={
          //   "absolute bottom-2 left-2 text-[10px] sm:text-xs text-black/90 bg-white/50 backdrop-blur px-1.5 py-0.5 rounded " +
          //   (showHover ? "opacity-0" : "opacity-100 transition-opacity duration-200")
          // }
          className={
            "absolute bottom-2 left-2 text-[10px] sm:text-xs text-black bg-transparent transition-opacity " +
            (showHover ? "opacity-0" : "opacity-100")
          }
        >
          {label}
        </div>
      )}
    </div>
  );
}

// import React from "react";
// import { useParams, Link } from "react-router-dom";
// import { useRegistry } from "../data/RegistryProvider";
// import { slugify } from "../utils/slug";
// import { useDocumentTitle } from "../hooks/useDocumentTitle";
// import { prefetchMany, injectPreloadLinks } from "../utils/prefetch";
// import { assetUrl } from "../utils/assets";

// export function BrandPage() {
//   const { data, loading, error } = useRegistry();
//   const { brand = "" } = useParams<{ brand: string }>();

//   if (loading) return <div className="p-6">Загрузка…</div>;
//   if (error)   return <div className="p-6 text-red-600">Ошибка загрузки: {String(error)}</div>;
//   if (!data)   return <div className="p-6">Нет данных.</div>;

//   // Бренд в URL держим в UPPERCASE (маркетинговое требование)
//   const brandKey = decodeURIComponent(brand).toLocaleUpperCase("ru-RU");
//   const brandData = data.brands[brandKey];

//   useDocumentTitle(`${brandKey} — HANIFA MARKET`);

//   if (!brandData) return <div className="p-6">Бренд не найден.</div>;

//   // 1) preload первых 4 базовых картинок (ускоряет старт отрисовки)
//   React.useEffect(() => {
//     const urls = brandData.items.map((it) => it.baseImage);
//     const cleanup = injectPreloadLinks(urls, 4);
//     return cleanup;
//   }, [brandKey]);

//   // 2) префетч первых N базовых и hover-картинок (неблокирующе)
//   React.useEffect(() => {
//     const baseUrls  = brandData.items.map((it) => it.baseImage);
//     const hoverUrls = brandData.items.map((it) => it.hoverImage);
//     prefetchMany(baseUrls, 12);
//     prefetchMany(hoverUrls, 12);
//   }, [brandKey]);

//   return (
//     <div className="min-h-full flex flex-col">
//       {/* Логотип бренда */}
//       <div className="pt-8 md:pt-12 flex flex-col items-center">
//         <div className="w-full flex items-center justify-center">
//           {brandData.brandLogo && (
//             <img
//               src={assetUrl(brandData.brandLogo)}
//               alt={brandKey}
//               className="object-contain max-w-[380px] w-[20vw] min-w-[260px]"
//             />
//           )}
//         </div>

//         {/* Подпись + «назад» */}
//         <div className="relative w-full mt-6">
//           <Link
//             to="/"
//             className="absolute left-5 md:left-10 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 text-xs md:text-sm opacity-70 hover:opacity-100 z-10"
//           >
//             <span className="text-lg leading-none">←</span>
//             <span>назад</span>
//           </Link>

//           <div className="text-base md:text-lg text-center opacity-80 px-4 whitespace-nowrap mx-auto">
//             Выбери свой предмет гардероба
//           </div>
//         </div>
//       </div>

//       {/* Сетка товаров */}
//       <div className="flex-1 mt-6 md:mt-10">
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
//           {brandData.items.map((item, idx) => {
//             const routeSlug = (item.slug || slugify(item.name)).toLocaleUpperCase("ru-RU");
//             const priority = idx < 8; // первые 2 ряда — высокая важность

//             return (
//               <Link
//                 key={`${brandKey}:${routeSlug}`}
//                 // используем текущую схему роутинга (/brand/:brand/item/:slug)
//                 to={`/brand/${encodeURIComponent(brandKey)}/item/${encodeURIComponent(routeSlug)}`}
//                 className="relative block group"
//               >
//                 <div className="aspect-[3/4] w-full bg-white overflow-hidden">
//                   <BrandCardImage
//                     base={assetUrl(item.baseImage)} 
//                     hover={assetUrl(item.hoverImage)}
//                     alt={item.name}
//                     label={item.name}
//                     priority={priority}
//                   />
//                 </div>
//               </Link>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }

// function BrandCardImage({
//   base,
//   hover,
//   alt,
//   label,
//   priority = false,
// }: {
//   base?: string;
//   hover?: string;
//   alt?: string;
//   label?: string;
//   priority?: boolean;
// }) {
//   const [src, setSrc] = React.useState(base);
//   const [hoverLoaded, setHoverLoaded] = React.useState(false);
//   const [hovered, setHovered] = React.useState(false);

//   // Предзагрузка hover-изображения
//   React.useEffect(() => {
//     if (!hover) return;
//     const img = new Image();
//     img.onload = () => setHoverLoaded(true);
//     img.decoding = "async";
//     img.src = hover;
//   }, [hover]);

//   const onEnter = () => {
//     setHovered(true);
//     if (hover) setSrc(hover);
//   };
//   const onLeave = () => {
//     setHovered(false);
//     setSrc(base);
//   };

//   const hideLabel = hovered && hoverLoaded;

//   return (
//     <div className="relative w-full h-full">
//       <img
//         src={src}
//         alt={alt}
//         className="w-full h-full object-cover transition-opacity duration-200"
//         onMouseEnter={onEnter}
//         onMouseLeave={onLeave}
//         loading={priority ? "eager" : "lazy"}
//         // Поддерживается в современных браузерах; TS обычно не против
//         fetchPriority={priority ? ("high" as any) : ("auto" as any)}
//         decoding={priority ? "sync" : "async"}
//       />
//       {label && (
//         <div
//           className={
//             "absolute bottom-2 left-2 text-[10px] sm:text-xs text-black bg-transparent transition-opacity " +
//             (hideLabel ? "opacity-0" : "opacity-100")
//           }
//         >
//           {label}
//         </div>
//       )}
//     </div>
//   );
// }


// // import React from "react";
// // import { useParams, Link } from "react-router-dom";

// // import { useRegistry } from "../data/RegistryProvider"; // ← этот импорт теперь найдётся
// // import { slugify } from "../utils/slug";

// // export function BrandPage() {
// //   const { brand = "" } = useParams<{ brand: string }>();
// //   // const { data, loading, error } = useRegistry(); // ← контекст
// //   const { data, loading, error } = useRegistry(); // ← контекст

// //   if (loading) return <div className="p-6">Загрузка…</div>;
// //   if (error) return <div className="p-6 text-red-600">Ошибка: {String(error)}</div>;
// //   if (!data) return <div className="p-6">Нет данных.</div>;

// //   const brandKey = brand;
// //   const brandObj = data.brands[brandKey];
// //   if (!brandObj) return <div className="p-6">Бренд не найден.</div>;

// //   return (
// //     <div className="min-h-full flex flex-col">
// //       {/* Логотип бренда */}
// //       <div className="pt-8 md:pt-12 flex flex-col items-center">
// //         <div className="w-full flex items-center justify-center">
// //           {brandObj.brandLogo && (
// //             <img
// //               src={brandObj.brandLogo}
// //               alt={brandKey}
// //               className="object-contain max-w-[380px] w-[20vw] min-w-[260px]"
// //             />
// //           )}
// //         </div>

// //         {/* Подпись + «назад» */}
// //         <div className="relative w-full mt-6">
// //           <Link
// //             to="/"
// //             className="absolute left-5 md:left-10 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 text-xs md:text-sm opacity-70 hover:opacity-100 z-10"
// //           >
// //             <span className="text-lg leading-none">←</span>
// //             <span>назад</span>
// //           </Link>

// //           <div className="text-base md:text-lg text-center opacity-80 px-4 whitespace-nowrap mx-auto">
// //             Выбери свой предмет гардероба:
// //           </div>
// //         </div>
// //       </div>

// //       {/* Сетка товаров */}
// //       <div className="flex-1 mt-6 md:mt-10">
// //         <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
// //           {brandObj.items.map((item) => {
// //             const routeSlug = item.slug || slugify(item.name);
// //             const key = routeSlug || item.name;
// //             return (
// //               <Link
// //                 key={`${brandKey}:${routeSlug}`}
// //                 to={`/brand/${encodeURIComponent(brandKey)}}`}
                
// //                 className="relative block group"
// //               >
// //                 <div className="aspect-[3/4] w-full bg-white overflow-hidden">
// //                   <BrandCardImage base={item.baseImage} hover={item.hoverImage} alt={item.name} label={item.name} />
// //                 </div>
// //               </Link>
// //             );
// //           })}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // Ховер: прячем подпись только после загрузки hover-изображения
// // function BrandCardImage({
// //   base,
// //   hover,
// //   alt,
// //   label,
// // }: {
// //   base?: string;
// //   hover?: string;
// //   alt?: string;
// //   label?: string;
// // }) {
// //   const initial = base || hover || "";
// //   const [src, setSrc] = React.useState(initial);
// //   const [hoverLoaded, setHoverLoaded] = React.useState(false);
// //   const [hovered, setHovered] = React.useState(false);

// //   React.useEffect(() => {
// //     if (!hover) return;
// //     const img = new Image();
// //     img.onload = () => setHoverLoaded(true);
// //     img.src = hover;
// //   }, [hover]);

// //   const onEnter = () => {
// //     setHovered(true);
// //     if (hover) setSrc(hover);
// //   };
// //   const onLeave = () => {
// //     setHovered(false);
// //     setSrc(base || hover || "");
// //   };

// //   const hideLabel = hovered && hoverLoaded;

// //   return (
// //     <div className="relative w-full h-full">
// //       <img
// //         src={src}
// //         alt={alt || ""}
// //         className="w-full h-full object-cover transition-opacity duration-200"
// //         onMouseEnter={onEnter}
// //         onMouseLeave={onLeave}
// //         loading="lazy"
// //       />
// //       {label && (
// //         <div
// //           className={
// //             "absolute bottom-2 left-2 text-[10px] sm:text-xs text-black bg-transparent transition-opacity " +
// //             (hideLabel ? "opacity-0" : "opacity-100")
// //           }
// //         >
// //           {label}
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // // import React from "react";
// // // import { useParams, Link } from "react-router-dom";
// // // import type { Registry } from "../types/registry";
// // // import { slugify } from "../utils/slug";

// // // export function BrandPage({ data }: { data: Registry }) {
// // //   const { brand = "" } = useParams<{ brand: string }>();
// // //   const brandKey = brand;
// // //   const brandObj = data.brands[brandKey];
// // //   if (!brandObj) return <div className="p-6">Бренд не найден.</div>;

// // //   return (
// // //     <div className="min-h-full flex flex-col">
// // //       {/* Логотип бренда */}
// // //       <div className="pt-8 md:pt-12 flex flex-col items-center">
// // //         <div className="w-full flex items-center justify-center">
// // //           {brandObj.brandLogo && (
// // //             <img
// // //               src={brandObj.brandLogo}
// // //               alt={brandKey}
// // //               className="object-contain max-w-[380px] w-[20vw] min-w-[260px]"
// // //             />
// // //           )}
// // //         </div>

// // //         {/* Подпись + «назад» */}
// // //         <div className="relative w-full mt-6">
// // //           <Link
// // //             to="/"
// // //             className="absolute left-5 md:left-10 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 text-xs md:text-sm opacity-70 hover:opacity-100 z-10"
// // //           >
// // //             <span className="text-lg leading-none">←</span>
// // //             <span>назад</span>
// // //           </Link>

// // //           <div className="text-base md:text-lg text-center opacity-80 px-4 whitespace-nowrap mx-auto">
// // //             Выбери свой предмет гардероба:
// // //           </div>
// // //         </div>
// // //       </div>

// // //       {/* Сетка товаров */}
// // //       <div className="flex-1 mt-6 md:mt-10">
// // //         <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
// // //           {brandObj.items.map((item) => {
// // //             const routeSlug = item.slug || slugify(item.name);
// // //             const key = routeSlug || item.name;
// // //             return (
// // //               <Link
// // //                 key={key}
// // //                 to={`/catalog/${encodeURIComponent(brandKey)}/${encodeURIComponent(routeSlug)}`}
// // //                 className="relative block group"
// // //               >
// // //                 <div className="aspect-[3/4] w-full bg-white overflow-hidden">
// // //                   <BrandCardImage
// // //                     base={item.baseImage}
// // //                     hover={item.hoverImage}
// // //                     alt={item.name}
// // //                     label={item.name}
// // //                   />
// // //                 </div>
// // //               </Link>
// // //             );
// // //           })}
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // // Ховер: прячем подпись только после загрузки hover-изображения
// // // function BrandCardImage({
// // //   base,
// // //   hover,
// // //   alt,
// // //   label,
// // // }: {
// // //   base?: string;
// // //   hover?: string;
// // //   alt?: string;
// // //   label?: string;
// // // }) {
// // //   const initial = base || hover || "";
// // //   const [src, setSrc] = React.useState(initial);
// // //   const [hoverLoaded, setHoverLoaded] = React.useState(false);
// // //   const [hovered, setHovered] = React.useState(false);

// // //   // Предзагрузка hover-изображения
// // //   React.useEffect(() => {
// // //     if (!hover) return;
// // //     const img = new Image();
// // //     img.onload = () => setHoverLoaded(true);
// // //     img.src = hover;
// // //   }, [hover]);

// // //   const onEnter = () => {
// // //     setHovered(true);
// // //     if (hover) setSrc(hover);
// // //   };
// // //   const onLeave = () => {
// // //     setHovered(false);
// // //     setSrc(base || hover || "");
// // //   };

// // //   const hideLabel = hovered && hoverLoaded;

// // //   return (
// // //     <div className="relative w-full h-full">
// // //       <img
// // //         src={src}
// // //         alt={alt || ""}
// // //         className="w-full h-full object-cover transition-opacity duration-200"
// // //         onMouseEnter={onEnter}
// // //         onMouseLeave={onLeave}
// // //         loading="lazy"
// // //       />
// // //       {label && (
// // //         <div
// // //           className={
// // //             "absolute bottom-2 left-2 text-[10px] sm:text-xs text-black bg-transparent transition-opacity " +
// // //             (hideLabel ? "opacity-0" : "opacity-100")
// // //           }
// // //         >
// // //           {label}
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // }

// // // // import React from "react";
// // // // import { Link, useParams } from "react-router-dom";
// // // // import { useRegistry } from "../data/RegistryContext";
// // // // import { slugify } from "../utils/slug";

// // // // export function BrandPage() {
// // // //   const { brand } = useParams();
// // // //   const { data } = useRegistry();
// // // //   if (!data || !brand) return null;

// // // //   const brandData = data.brands[brand];
// // // //   if (!brandData) return <div className="p-6">Бренд не найден.</div>;

// // // //   return (
// // // //     <div className="min-h-full flex flex-col">
// // // //       {/* Логотип бренда */}
// // // //       <div className="pt-8 md:pt-12 flex flex-col items-center">
// // // //         <div className="w-full flex items-center justify-center">
// // // //           {brandData.brandLogo && (
// // // //             <img
// // // //               src={brandData.brandLogo}
// // // //               alt={brand}
// // // //               className="object-contain max-w-[380px] w-[20vw] min-w-[260px]"
// // // //             />
// // // //           )}
// // // //         </div>

// // // //         {/* Подпись + «назад» */}
// // // //         <div className="relative w-full mt-6">
// // // //           <Link
// // // //             to="/"
// // // //             className="absolute left-5 md:left-10 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 text-xs md:text-sm opacity-70 hover:opacity-100 z-10"
// // // //           >
// // // //             <span className="text-lg leading-none">←</span>
// // // //             <span>назад</span>
// // // //           </Link>

// // // //           <div className="text-base md:text-lg text-center opacity-80 px-4 whitespace-nowrap mx-auto">
// // // //             Выбери свой предмет гардероба:
// // // //           </div>
// // // //         </div>
// // // //       </div>

// // // //       {/* Сетка товаров */}
// // // //       <div className="flex-1 mt-6 md:mt-10">
// // // //         <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
// // // //           {brandData.items.map((item) => {
// // // //             const routeSlug = item.slug || slugify(item.name);
// // // //             return (
// // // //               <Link
// // // //               key={item.name + routeSlug}
// // // //               to={`/catalog/${encodeURIComponent(brandKey)}/${encodeURIComponent(routeSlug)}`}
// // // //               className="relative block group"
// // // //               >
// // // //                 <div className="aspect-[3/4] w-full bg-white overflow-hidden">
// // // //                   <BrandCardImage base={item.baseImage} hover={item.hoverImage} alt={item.name} label={item.name} />
// // // //                 </div>
// // // //               </Link>
// // // //             );
// // // //           })}
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }

// // // // // Ховер: прячем подпись только после загрузки hover-изображения
// // // // function BrandCardImage({
// // // //   base,
// // // //   hover,
// // // //   alt,
// // // //   label,
// // // // }: {
// // // //   base?: string;
// // // //   hover?: string;
// // // //   alt?: string;
// // // //   label?: string;
// // // // }) {
// // // //   const [src, setSrc] = React.useState(base);
// // // //   const [hoverLoaded, setHoverLoaded] = React.useState(false);
// // // //   const [hovered, setHovered] = React.useState(false);

// // // //   // Предзагрузка hover-изображения
// // // //   React.useEffect(() => {
// // // //     if (!hover) return;
// // // //     const img = new Image();
// // // //     img.onload = () => setHoverLoaded(true);
// // // //     img.src = hover;
// // // //   }, [hover]);

// // // //   const onEnter = () => {
// // // //     setHovered(true);
// // // //     if (hover) setSrc(hover);
// // // //   };
// // // //   const onLeave = () => {
// // // //     setHovered(false);
// // // //     setSrc(base);
// // // //   };

// // // //   const hideLabel = hovered && hoverLoaded;

// // // //   return (
// // // //     <div className="relative w-full h-full">
// // // //       <img
// // // //         src={src}
// // // //         alt={alt}
// // // //         className="w-full h-full object-cover transition-opacity duration-200"
// // // //         onMouseEnter={onEnter}
// // // //         onMouseLeave={onLeave}
// // // //       />
// // // //       {label && (
// // // //         <div
// // // //           className={
// // // //             "absolute bottom-2 left-2 text-[10px] sm:text-xs text-black bg-transparent transition-opacity " +
// // // //             (hideLabel ? "opacity-0" : "opacity-100")
// // // //           }
// // // //         >
// // // //           {label}
// // // //         </div>
// // // //       )}
// // // //     </div>
// // // //   );
// // // // }

// // // // // import React from "react";
// // // // // import type { Registry } from "../types/registry";
// // // // // import { slugify } from "../utils/slug";


// // // // // export function BrandPage({ data, brandKey }: { data: Registry; brandKey: string }) {
// // // // //   const brand = data.brands[brandKey];
// // // // //   if (!brand) return <div className="p-6">Бренд не найден.</div>;

// // // // //   return (
// // // // //     <div className="min-h-full flex flex-col">
// // // // //       {/* Логотип бренда */}
// // // // //       <div className="pt-8 md:pt-12 flex flex-col items-center">
// // // // //         <div className="w-full flex items-center justify-center">
// // // // //           {brand.brandLogo && (
// // // // //             <img
// // // // //               src={brand.brandLogo}
// // // // //               alt={brandKey}
// // // // //               className="object-contain max-w-[380px] w-[20vw] min-w-[260px]"
// // // // //             />
// // // // //           )}
// // // // //         </div>

// // // // //         {/* Подпись + «назад» */}
// // // // //         <div className="relative w-full mt-6">
// // // // //             <a
// // // // //             href="#/"
// // // // //             className="absolute left-5 md:left-10 top-1/2 -translate-y-1/2
// // // // //                         inline-flex items-center gap-2 text-xs md:text-sm
// // // // //                         opacity-70 hover:opacity-100 z-10"
// // // // //             >

// // // // //             <span className="text-lg leading-none">←</span><span>назад</span>
// // // // //           </a>

// // // // //           <div className="text-base md:text-lg text-center opacity-80 px-4 whitespace-nowrap mx-auto">
// // // // //             Выбери свой предмет гардероба:
// // // // //           </div>
// // // // //         </div>
// // // // //       </div>

// // // // //       {/* Сетка товаров */}
// // // // //       <div className="flex-1 mt-6 md:mt-10">
// // // // //         <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
// // // // //           {brand.items.map((item) => {
// // // // //             const routeSlug = item.slug || slugify(item.name);
// // // // //             return (
// // // // //               <a
// // // // //                 key={item.id}
// // // // //                 href={`#/brand/${encodeURIComponent(brandKey)}/item/${encodeURIComponent(routeSlug)}`}
// // // // //                 className="relative block"
// // // // //               >
// // // // //                 <div className="aspect-[3/4] w-full bg-white overflow-hidden">
// // // // //                   <BrandCardImage
// // // // //                     base={item.baseImage}
// // // // //                     hover={item.hoverImage}
// // // // //                     alt={item.name}
// // // // //                     label={item.name}  // Лейбл теперь рисует сам BrandCardImage
// // // // //                   />
// // // // //                 </div>
// // // // //               </a>
// // // // //             );
// // // // //           })}

// // // // //         </div>
// // // // //       </div>
// // // // //     </div>
// // // // //   );
// // // // // }

// // // // // function BrandCardImage(
// // // // //     { base, hover, alt, label }: { base?: string; hover?: string; alt?: string; label?: string }
// // // // //   ) {
// // // // //     const [src, setSrc] = React.useState(base);
// // // // //     const [hoverLoaded, setHoverLoaded] = React.useState(false);
// // // // //     const [hovered, setHovered] = React.useState(false);

// // // // //     // Предзагрузка hover-изображения
// // // // //     React.useEffect(() => {
// // // // //       if (!hover) return;
// // // // //       const img = new Image();
// // // // //       img.onload = () => setHoverLoaded(true);
// // // // //       img.src = hover;
// // // // //     }, [hover]);

// // // // //     const onEnter = () => {
// // // // //       setHovered(true);
// // // // //       if (hover) setSrc(hover);
// // // // //     };
// // // // //     const onLeave = () => {
// // // // //       setHovered(false);
// // // // //       setSrc(base);
// // // // //     };

// // // // //     const hideLabel = hovered && hoverLoaded; // прячем подпись ТОЛЬКО после загрузки hover

// // // // //     return (
// // // // //       <div className="relative w-full h-full">
// // // // //         <img
// // // // //           src={src}
// // // // //           alt={alt}
// // // // //           className="w-full h-full object-cover transition-opacity duration-200"
// // // // //           onMouseEnter={onEnter}
// // // // //           onMouseLeave={onLeave}
// // // // //         />
// // // // //         {label && (
// // // // //           <div
// // // // //             className={
// // // // //               "absolute bottom-2 left-2 text-[10px] sm:text-xs text-black bg-transparent transition-opacity " +
// // // // //               (hideLabel ? "opacity-0" : "opacity-100")
// // // // //             }
// // // // //           >
// // // // //             {label}
// // // // //           </div>
// // // // //         )}
// // // // //       </div>
// // // // //     );
// // // // //   }


// // // // //   // function BrandCardImage({ base, hover, alt }: { base?: string; hover?: string; alt?: string }) {
// // // // //   //   const [src, setSrc] = React.useState(base);
// // // // //   //   const [hoverLoaded, setHoverLoaded] = React.useState(false);

// // // // //   //   // Если hover-изображение есть — предварительно подгружаем
// // // // //   //   React.useEffect(() => {
// // // // //   //     if (!hover) return;
// // // // //   //     const img = new Image();
// // // // //   //     img.onload = () => setHoverLoaded(true);
// // // // //   //     img.src = hover;
// // // // //   //   }, [hover]);

// // // // //   //   return (
// // // // //   //     <img
// // // // //   //       src={src}
// // // // //   //       alt={alt}
// // // // //   //       className="w-full h-full object-cover transition-opacity duration-200"
// // // // //   //       onMouseEnter={() => hover && setSrc(hover)}
// // // // //   //       onMouseLeave={() => setSrc(base)}
// // // // //   //     />
// // // // //   //   );
// // // // //   // }
