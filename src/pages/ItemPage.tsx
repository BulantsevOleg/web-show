import React from "react";
import { useParams, Link } from "react-router-dom";
import { useRegistry } from "../data/RegistryProvider";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { prefetchMany } from "../utils/prefetch";
import { fetchItemMeta } from "../services/itemMeta";
import type { ItemMeta } from "../types/itemMeta";
import { assetUrl } from "../utils/assets";

export function ItemPage() {
  const { data } = useRegistry();
  const { brand = "", slug = "" } = useParams<{ brand: string; slug: string }>();
  const brandKey = decodeURIComponent(brand);
  const itemSlug = decodeURIComponent(slug).toLowerCase();

  const brandData = data?.brands?.[brandKey];
  if (!brandData) return <div className="p-6">Бренд не найден.</div>;

  const item = brandData.items.find((i) => (i.slug || "").toLowerCase() === itemSlug);
  if (!item) return <div className="p-6">Товар не найден.</div>;

  // 1) если статья уже есть в реестре — используем её как готовую модель
  const articleFromRegistry = item.article && (
    (item.article.blocks?.length || item.article.images?.length || item.article.wbLink)
  ) ? item.article : null;

  const [meta, setMeta] = React.useState<ItemMeta | null>(null);
  const [metaLoading, setMetaLoading] = React.useState(false);
  const [metaErr, setMetaErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (articleFromRegistry) return; // не грузим meta.json, если всё есть
    setMetaLoading(true);
    fetchItemMeta(item.slug || itemSlug)
      .then(setMeta)
      .catch(e => setMetaErr(String(e)))
      .finally(() => setMetaLoading(false));
  }, [item.slug, itemSlug, articleFromRegistry]);

  const a = articleFromRegistry ?? meta?.article;

  if (!a) {
    if (metaLoading) return <div className="p-6">Загрузка контента…</div>;
    if (metaErr)    return <div className="p-6 text-red-600">Ошибка: {metaErr}</div>;
    return <div className="p-6">Контент не найден.</div>;
  }
  
  React.useEffect(() => {
    const urls = item?.article?.images || [];
    if (urls.length) prefetchMany(urls, 4);
  }, [a]);

  const img = (i: number) => assetUrl(a?.images?.[i] || "");
  const txt = (i: number) => (a?.blocks?.[i] ? a.blocks[i] : "");

  useDocumentTitle(`${item.name} — ${brandKey} — HANIFA MARKET`);

  // перед этим можно вычислить флаги
  const hasWB = Boolean(a?.wbLink);
  const hasTG = Boolean(data.site.telegramLink);
  const cols = hasWB && hasTG ? "grid-cols-2" : "grid-cols-1";

  return (
    <article className="max-w-[1100px] mx-auto px-4 md:px-6">
      <header className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl tracking-tight text-center">{item.name}</h1>

        <div className="relative w-screen mt-2 left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
          <Link
            to={`/catalog/${encodeURIComponent(brandKey)}`}
            className="absolute left-5 md:left-10 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 text-xs md:text-sm opacity-70 hover:opacity-100 z-10"
          >
            <span className="text-lg leading-none">←</span>
            <span>назад</span>
          </Link>

          <div className="text-[11px] md:text-xs opacity-60 text-center">
            <div className="max-w-[1100px] mx-auto px-4 md:px-6">Бренд: {brandKey}</div>
          </div>
        </div>
      </header>

      {/* Лид */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen mb-6 md:mb-10">
        <img src={img(0)} alt={`${item.name} — лид`} className="w-screen md:h-[66vh] object-cover" />
      </div>

      {/* 1) Блок 1 */}
      {txt(0) && (
        <section className="mb-8 md:mb-12">
          <div className="text-[15px] md:text-base leading-relaxed [&>p]:whitespace-pre-line max-w-[760px] mx-auto">
            {a?.tocBefore1 && (
              <h3 className="text-lg md:text-xl leading-tight mb-3 font-bold tracking-tight text-center">
                {a.tocBefore1}
              </h3>
            )}
            <p className="mb-0">{txt(0)}</p>
          </div>
        </section>
      )}


      {/* 2) Фото слева, справа текст (+ опциональный подзаголовок) */}
      <section className="mb-8 md:mb-12">
        <div className="grid grid-cols-12 gap-4 md:gap-6 items-center">
          <div className="col-span-12 md:col-span-6 order-1">
            <figure>
              <img src={img(1)} alt={`${item.name} 2`} className="w-full h-auto object-cover" />
            </figure>
          </div>

          <div className="col-span-12 md:col-span-6 order-2 text-[15px] md:text-base leading-relaxed [&>p]:whitespace-pre-line">
            {a?.tocBefore2 && (
              <h3 className="text-lg md:text-xl leading-tight mb-3 font-bold tracking-tight text-center mt-3 md:mt-0">
                {a.tocBefore2}
              </h3>
            )}
            {txt(1) && <p>{txt(1)}</p>}
          </div>
        </div>
      </section>

      {/* 3) Полноширинный текст */}
      {txt(2) && (
        <section className="mb-8 md:mb-12">
          <div className="text-[15px] md:text-base leading-relaxed [&>p]:whitespace-pre-line max-w-[880px] mx-auto">
            <p className="mb-0">{txt(2)}</p>
          </div>
        </section>
      )}

      {/* 4) Две фотографии */}
      <section className="mb-8 md:mb-12">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <figure>
            <img src={img(2,)} alt={`${item.name} 3`} className="w-full h-auto object-cover" />
          </figure>
          <figure>
            <img src={img(3,)} alt={`${item.name} 4`} className="w-full h-auto object-cover" />
          </figure>
        </div>
      </section>

      {/* 6) Фото справа, слева текст (+ оглавление) */}
      {/* Текст 5 + Фото 5 — в одной секции, выровнены по центру */}
      <section className="mb-8 md:mb-12 items-center">
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* слева текст на десктопе, сверху на мобиле */}
          <div className="col-span-12 md:col-span-6 order-2 md:order-1 text-[15px] md:text-base leading-relaxed [&>p]:whitespace-pre-line self-center">
            {a?.tocBefore5 && (
              <h3 className="text-lg md:text-xl leading-tight mb-3 font-bold tracking-tight text-center mt-3 md:mt-0">
                {a.tocBefore5}
              </h3>
            )}
            {txt(3) && <p>{txt(3)}</p>}
            {/* {txt(4) && <p>{txt(4)}</p>} */}
          </div>

          {/* справа фото на десктопе, ниже на мобиле */}
          <div className="col-span-12 md:col-span-6 order-1 md:order-2 self-center">
            <figure>
              <img src={img(4)} alt={`${item.name} 5`} className="w-full h-auto object-cover" />
            </figure>
          </div>
        </div>
      </section>

      {/* Заголовок перед 6 блоком */}
      {a?.tocBefore6 && (
        <h3 className="text-lg md:text-xl leading-tight mb-3 font-bold tracking-tight text-center mt-3 md:mt-0">
          {a.tocBefore6}
        </h3>
      )}
      {txt(4) && (
        <section className="mb-8 md:mb-12">
          <div className="text-[15px] md:text-base leading-relaxed [&>p]:whitespace-pre-line max-w-[880px] mx-auto">
            <p className="mb-0">{txt(4)}</p>
          </div>
        </section>
      )}      
      {txt(5) && (
        <section className="mb-8 md:mb-12">
          <div className="text-[15px] md:text-base leading-relaxed [&>p]:whitespace-pre-line max-w-[880px] mx-auto">
            <p className="mb-0">{txt(5)}</p>
          </div>
        </section>
      )}
      {/* 6-я фотография */}
      <section className="mb-8 md:mb-12">
        <figure>
          <img src={img(5)} alt={`${item.name} 6 — крупный кадр`} className="w-full h-auto object-cover" />
        </figure>
      </section>

      {/* Текст №7 — сразу после 6-й фото */}
      {txt(6) && (
        <section className="mb-8 md:mb-12">
          <div className="text-[15px] md:text-base leading-relaxed [&>p]:whitespace-pre-line max-w-[880px] mx-auto">
            <p className="mb-0">{txt(6)}</p>
          </div>
        </section>
      )}

      {/* Атмосферный 3:2 */}
      <section className="mb-10 md:mb-14">
        <div className="mx-auto aspect-[3/2] w-[880px] max-w-[92vw]">
          <img src={img(6)} alt="Атмосферный кадр" className="w-full h-full object-cover" />
        </div>
      </section>

      {/* CTA */}
      <footer className="max-w-[760px] mx-auto border-t border-black/10 pt-8 md:pt-10 pb-8 mb-40 md:mb-48">
        <div className="text-xs md:text-sm opacity-80 text-center whitespace-pre-line">
          {data.site.footerNote || "Собери капсулу из наших айтемов\nили обратись к нам в чат и мы в этом поможем!"}
        </div>

        {/* Кнопки одинакового размера и центрированы */}
        <div className={`mt-6 grid ${cols} gap-3 md:gap-6 w-full max-w-[680px] mx-auto items-stretch`}>
          {hasWB && (
            <a
              href={a!.wbLink}
              target="_blank"
              rel="noreferrer"
              className="w-full h-full px-4 py-3 rounded-full border border-black flex items-center justify-center text-base text-center leading-snug hover:bg-black hover:text-white transition"
            >
              Купить на WB
            </a>
          )}

          {hasTG && (
            <a
              href={data.site.telegramLink!}
              target="_blank"
              rel="noreferrer"
              className="w-full h-full px-4 py-3 rounded-full border border-black flex items-center justify-center text-base text-center leading-snug hover:bg_black hover:text-white transition"
            >
              Задать вопрос в Telegram
            </a>
          )}
        </div>
      </footer>

    </article>
  );
}

// import React from "react";
// import { Link, useParams } from "react-router-dom";
// import { useRegistry } from "../data/RegistryContext";
// import { getItemByBrandAndSlug } from "../utils/items";

// export function ItemPage() {
//   const { brand, slug } = useParams();
//   const { data } = useRegistry();
//   if (!data || !brand || !slug) return null;

//   const item = getItemByBrandAndSlug(data, brand, slug);
//   if (!item) return <div className="p-6">Товар не найден.</div>;
//   const a = item.article;

//   const img = (i: number, fallback?: string) => a?.images?.[i] || "";
//   const txt = (i: number) => a?.blocks?.[i] || "";

//   return (
//     <article className="max-w-[1100px] mx-auto px-4 md:px-6">
//       <header className="mb-6 md:mb-8">
//         <h1 className="text-xl md:text-2xl tracking-tight text-center">{item.name}</h1>

//         <div className="relative w-screen mt-2 left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
//           <Link
//             to={`/catalog/${encodeURIComponent(brand)}`}
//             className="absolute left-5 md:left-10 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 text-xs md:text-sm opacity-70 hover:opacity-100 z-10"
//             >
//             <span className="text-lg leading-none">←</span>
//             <span>назад</span>
//           </Link>

//           <div className="text-[11px] md:text-xs opacity-60 text-center">
//             <div className="max-w-[1100px] mx-auto px-4 md:px-6">Бренд: {brand}</div>
//           </div>
//         </div>
//       </header>

//       {/* Лид */}
//       <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen mb-6 md:mb-10">
//         <img src={img(0, "Лид")} alt={`${item.name} — лид`} className="w-screen md:h-[66vh] object-cover" />
//       </div>

//       {/* 1) Блок 1 */}
//       {txt(0) && (
//         <section className="mb-8 md:mb-12">
//           <div className="text-[15px] md:text-base leading-relaxed [&>p]:whitespace-pre-line max-w-[760px] mx-auto">
//             <p className="mb-0">{txt(0)}</p>
//           </div>
//         </section>
//       )}

//       {/* 2) Фото слева, справа текст (+ опциональный подзаголовок) */}
//       <section className="mb-8 md:mb-12">
//         <div className="grid grid-cols-12 gap-4 md:gap-6 items-start">
//           <div className="col-span-12 md:col-span-6 order-1">
//             <figure>
//               <img src={img(1, "Фото 2")} alt={`${item.name} 2`} className="w-full h-auto object-cover" />
//             </figure>
//           </div>

//           <div className="col-span-12 md:col-span-6 order-2 text-[15px] md:text-base leading-relaxed [&>p]:whitespace-pre-line">
//             {a?.tocBefore2 && (
//               <h3 className="text-lg md:text-xl leading-tight mb-3 font-bold tracking-tight text-center mt-3 md:mt-0">
//                 {a.tocBefore2}
//               </h3>
//             )}
//             {txt(1) && <p>{txt(1)}</p>}
//           </div>
//         </div>
//       </section>

//       {/* 3) Полноширинный текст */}
//       {txt(2) && (
//         <section className="mb-8 md:mb-12">
//           <div className="text-[15px] md:text-base leading-relaxed [&>p]:whitespace-pre-line max-w-[880px] mx-auto">
//             <p className="mb-0">{txt(2)}</p>
//           </div>
//         </section>
//       )}

//       {/* 4) Две фотографии */}
//       <section className="mb-8 md:mb-12">
//         <div className="grid grid-cols-2 gap-3 md:gap-4">
//           <figure>
//             <img src={img(2, "Фото 3")} alt={`${item.name} 3`} className="w-full h-auto object-cover" />
//           </figure>
//           <figure>
//             <img src={img(3, "Фото 4")} alt={`${item.name} 4`} className="w-full h-auto object-cover" />
//           </figure>
//         </div>
//       </section>

//       {/* 6) Фото справа, слева текст (+ оглавление) */}
//       <section className="mb-8 md:mb-12">
//         <div className="grid grid-cols-12 gap-4 md:gap-6 items-start">
//           <div className="col-span-12 md:col-span-6 order-2 md:order-1 text-[15px] md:text-base leading-relaxed [&>p]:whitespace-pre-line">
//             {a?.tocBefore6 && (
//               <h3 className="text-lg md:text-xl leading-tight mb-3 font-bold tracking-tight text-center mt-3 md:mt-0">
//                 {a.tocBefore6}
//               </h3>
//             )}
//             {txt(3) && <p>{txt(3)}</p>}
//           </div>

//           <div className="col-span-12 md:col-span-6 order-1 md:order-2">
//             <figure>
//               <img src={img(4, "Фото 5")} alt={`${item.name} 5`} className="w-full h-auto object-cover" />
//             </figure>
//           </div>
//         </div>
//       </section>

//       {/* Дополнительные тексты до 6-й фото */}
//       {txt(4) && (
//         <section className="mb-8 md:mb-12">
//           <div className="text-[15px] md:text-base leading-relaxed [&>p]:whitespace-pre-line max-w-[880px] mx-auto">
//             <p className="mb-0">{txt(4)}</p>
//           </div>
//         </section>
//       )}
//       {txt(5) && (
//         <section className="mb-8 md:mb-12">
//           <div className="text-[15px] md:text-base leading-relaxed [&>p]:whitespace-pre-line max-w-[880px] mx-auto">
//             <p className="mb-0">{txt(5)}</p>
//           </div>
//         </section>
//       )}

//       {/* 6-я фотография */}
//       <section className="mb-8 md:mb-12">
//         <figure>
//           <img src={img(5, "Фото 6")} alt={`${item.name} 6 — крупный кадр`} className="w-full h-auto object-cover" />
//         </figure>
//       </section>

//       {/* Текст №7 — сразу после 6-й фото */}
//       {txt(6) && (
//         <section className="mb-8 md:mb-12">
//           <div className="text-[15px] md:text-base leading-relaxed [&>p]:whitespace-pre-line max-w-[880px] mx-auto">
//             <p className="mb-0">{txt(6)}</p>
//           </div>
//         </section>
//       )}

//       {/* Атмосферный 3:2 */}
//       <section className="mb-10 md:mb-14">
//         <div className="mx-auto aspect-[3/2] w-[880px] max-w-[92vw]">
//           <img src={img(6, "3:2")} alt="Атмосферный кадр" className="w-full h-full object-cover" />
//         </div>
//       </section>

//       {/* CTA */}
//       <footer className="max-w-[760px] mx-auto border-t border-black/10 pt-8 md:pt-10 pb-8 mb-40 md:mb-48">
//         <div className="text-xs md:text-sm opacity-80 text-center">
//           { (data.site.footerNote) || "Собери капсулу из наших айтемов или обратись к нам в чат и мы в этом поможем!" }
//         </div>
//         <div className="mt-6 flex justify-center gap-4 md:gap-6">
//           {a?.wbLink ? (
//             <a
//               href={a.wbLink}
//               target="_blank"
//               rel="noreferrer"
//               className="px-6 md:px-8 py-3 rounded-full border border-black hover:bg-black hover:text-white transition"
//             >
//               Перейти на WB
//             </a>
//           ) : null}
//           {data.site.telegramLink && (
//             <a
//               href={data.site.telegramLink}
//               target="_blank"
//               rel="noreferrer"
//               className="px-6 md:px-8 py-3 rounded-full border border-black hover:bg-black hover:text-white transition"
//             >
//               Задать вопрос в Telegram
//             </a>
//           )}
//         </div>
//       </footer>
//     </article>
//   );
// }

// // // src/pages/ItemPage.tsx
// // import React from "react";
// // import type { Registry } from "../types/registry";

// // import { slugify } from "../utils/slug";

// // export function ItemPage({ data, brandKey, slug }: { data: Registry; brandKey: string; slug: string }) {
// //   const brand = data.brands[brandKey];
// //   if (!brand) return <div className="p-6">Бренд не найден.</div>;
// //   const item = brand.items.find(i => (i.slug || slugify(i.name)) === slug);
// //   if (!item) return <div className="p-6">Товар не найден.</div>;
// //   // const a = item.article;

// //   // const img = (i: number) => a.images?.[i] || "";
// //   // const txt = (i: number) => a.blocks?.[i] || "";
// //   type ArticleSafe = {
// //     blocks: string[];
// //     images: string[];
// //     wbLink: string;
// //     tocBefore2: string;
// //     tocBefore6: string;
// //   };
  
// //   const a: ArticleSafe = React.useMemo(() => {
// //     const base: any = item.article ?? {};
// //     return {
// //       blocks: Array.isArray(base.blocks) ? base.blocks : [],
// //       images: Array.isArray(base.images) ? base.images : [],
// //       wbLink: typeof base.wbLink === "string" ? base.wbLink : "",
// //       tocBefore2: typeof base.tocBefore2 === "string" ? base.tocBefore2 : "",
// //       tocBefore6: typeof base.tocBefore6 === "string" ? base.tocBefore6 : "",
// //     };
// //   }, [item]);
  
// //   const img = (i: number) => a.images[i] || "";
// //   const txt = (i: number) => a.blocks[i] || "";
  

// //   return (
// //     <article className="max-w-[1100px] mx-auto px-4 md:px-6">
// //       <header className="mb-6 md:mb-8">
// //         <h1 className="text-xl md:text-2xl tracking-tight text-center">{item.name}</h1>

// //         <div className="relative w-screen mt-2 left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
// //           <a
// //             href={`#/brand/${encodeURIComponent(brandKey)}`}
// //             className="absolute left-5 md:left-10 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 text-xs md:text-sm opacity-70 hover:opacity-100 z-10"
// //           >
// //             <span className="text-lg leading-none">←</span>
// //             <span>назад</span>
// //           </a>
// //           <div className="text-[11px] md:text-xs opacity-60 text-center">
// //             <div className="max-w-[1100px] mx-auto px-4 md:px-6">Бренд: {brandKey}</div>
// //           </div>
// //         </div>
// //       </header>

// //       {/* Лид */}
// //       <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen mb-6 md:mb-10">
// //         <img src={img(0)} alt={`${item.name} — лид`} className="w-screen md:h-[66vh] object-cover" />
// //       </div>

// //       {/* 1) Текст 1 */}
// //       {txt(0) && (
// //         <section className="mb-8 md:mb-12 max-w-[760px] mx-auto">
// //           <div className="text-[15px] md:text-base leading-relaxed whitespace-pre-line">{txt(0)}</div>
// //         </section>
// //       )}

// //       {/* 2) Фото слева + сводный текст (2) справа */}
// //       <section className="mb-8 md:mb-12">
// //         <div className="grid grid-cols-12 gap-4 md:gap-6 items-start">
// //           <div className="col-span-12 md:col-span-6 order-1">
// //             <img src={img(1)} alt={`${item.name} 2`} className="w-full h-auto object-cover" />
// //           </div>

// //           <div className="col-span-12 md:col-span-6 order-2 text-[15px] md:text-base leading-relaxed whitespace-pre-line">
// //             {a.tocBefore2 && (
// //               <h3 className="text-lg md:text-xl leading-tight mb-3 font-bold tracking-tight text-center mt-3 md:mt-0">{a.tocBefore2}</h3>
// //             )}
// //             {txt(1)}
// //           </div>
// //         </div>
// //       </section>

// //       {/* 3) Полноширинный текст (3) */}
// //       {txt(2) && (
// //         <section className="mb-8 md:mb-12 max-w-[880px] mx-auto">
// //           <div className="text-[15px] md:text-base leading-relaxed whitespace-pre-line">{txt(2)}</div>
// //         </section>
// //       )}

// //       {/* 4) Две фотографии */}
// //       <section className="mb-8 md:mb-12 grid grid-cols-2 gap-3 md:gap-4">
// //         <img src={img(2)} alt={`${item.name} 3`} className="w-full h-auto object-cover" />
// //         <img src={img(3)} alt={`${item.name} 4`} className="w-full h-auto object-cover" />
// //       </section>

// //       {/* 5) Фото справа + сводный текст (4) слева */}
// //       <section className="mb-8 md:mb-12">
// //         <div className="grid grid-cols-12 gap-4 md:gap-6 items-start">
// //           <div className="col-span-12 md:col-span-6 order-2 md:order-1 text-[15px] md:text-base leading-relaxed whitespace-pre-line">
// //             {a.tocBefore6 && (
// //               <h3 className="text-lg md:text-xl leading-tight mb-3 font-bold tracking-tight text-center mt-3 md:mt-0">{a.tocBefore6}</h3>
// //             )}
// //             {txt(3)}
// //           </div>
// //           <div className="col-span-12 md:col-span-6 order-1 md:order-2">
// //             <img src={img(4)} alt={`${item.name} 5`} className="w-full h-auto object-cover" />
// //           </div>
// //         </div>
// //       </section>

// //       {/* 6) Доп. тексты до 6-й фотографии (№5 и №6 по новой схеме) */}
// //       {txt(4) && (
// //         <section className="mb-8 md:mb-12 max-w-[880px] mx-auto">
// //           <div className="text-[15px] md:text-base leading-relaxed whitespace-pre-line">{txt(4)}</div>
// //         </section>
// //       )}
// //       {txt(5) && (
// //         <section className="mb-8 md:mb-12 max-w-[880px] mx-auto">
// //           <div className="text-[15px] md:text-base leading-relaxed whitespace-pre-line">{txt(5)}</div>
// //         </section>
// //       )}

// //       {/* 6-я фотография */}
// //       <section className="mb-8 md:mb-12">
// //         <img src={img(5)} alt={`${item.name} 6`} className="w-full h-auto object-cover" />
// //       </section>

// //       {/* 7) Текст после 6-й фото */}
// //       {txt(6) && (
// //         <section className="mb-8 md:mb-12 max-w-[880px] mx-auto">
// //           <div className="text-[15px] md:text-base leading-relaxed whitespace-pre-line">{txt(6)}</div>
// //         </section>
// //       )}

// //       {/* Горизонтальный 3:2 */}
// //       <section className="mb-10 md:mb-14">
// //         <div className="mx-auto aspect-[3/2] w-[880px] max-w-[92vw]">
// //           <img src={img(6)} alt="Атмосферный кадр" className="w-full h-full object-cover" />
// //         </div>
// //       </section>

// //       {/* CTA футер + WB кнопка */}
// //       <footer className="max-w-[760px] mx-auto border-t border-black/10 pt-8 md:pt-10 pb-8 mb-40 md:mb-48">
// //         <div className="text-xs md:text-sm opacity-80 text-center">
// //           {data.site.footerNote || "Собери капсулу из наших айтемов или обратись к нам в чат и мы в этом поможем!"}
// //         </div>
// //         <div className="mt-6 flex justify-center gap-4 md:gap-6">
// //           {a.wbLink && (
// //             <a
// //               href={a.wbLink}
// //               target="_blank"
// //               className="px-6 md:px-8 py-3 rounded-full border border-black transition hover:bg-black hover:text-white"
// //             >
// //               Перейти на WB
// //             </a>
// //           )}
// //           {data.site.telegramLink && (
// //             <a
// //               href={data.site.telegramLink}
// //               target="_blank"
// //               className="px-6 md:px-8 py-3 rounded-full border border-black transition hover:bg-black hover:text-white"
// //             >
// //               Задать вопрос в Telegram
// //             </a>
// //           )}
// //         </div>
// //       </footer>
// //     </article>
// //   );
// // }


// // // import React from "react";
// // // import type { Registry } from "../types/registry";
// // // import { Figure } from "../components/Figure";
// // // import { FigurePair } from "../components/FigurePair";
// // // import { Prose } from "../components/Prose";


// // // export function ItemPage({ data, brandKey, slug }: { data: Registry; brandKey: string; slug: string }) {
// // //   const brand = data.brands[brandKey];
// // //   if (!brand) return <div className="p-6">Бренд не найден.</div>;

// // //   const item = brand.items.find((i) => i.slug === slug);
// // //   if (!item) return <div className="p-6">Товар не найден.</div>;

// // //   const a = item.article || {};
// // //   const img = (i: number) => (a.images?.[i] ? a.images[i] : undefined);
// // //   const txt = (i: number) => (a.blocks?.[i] ? a.blocks[i] : "");

// // //   return (
// // //     <article className="max-w-[1100px] mx-auto px-4 md:px-6">
// // //       <header className="mb-6 md:mb-8">
// // //         <h1 className="text-xl md:text-2xl tracking-tight text-center">{item.name}</h1>
// // //         <div className="relative w-full mt-2">
// // //           <a
// // //             href={`#/brand/${encodeURIComponent(brandKey)}`}
// // //             className="absolute left-5 md:left-10 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 text-xs md:text-sm opacity-70 hover:opacity-100 transition-all"
// // //           >
// // //             <span className="text-lg leading-none">←</span><span>назад</span>
// // //           </a>
// // //           <div className="text-[11px] md:text-xs opacity-60 text-center">Бренд: {brandKey}</div>
// // //         </div>
// // //       </header>

// // //       {/* Лид фото */}
// // //       {img(0) && (
// // //         <div className="mb-6 md:mb-10 -mx-[50vw] left-1/2 right-1/2 relative w-screen">
// // //           <img src={img(0)} alt={`${item.name} — лид`} className="w-screen md:h-[66vh] object-cover" />
// // //         </div>
// // //       )}

// // //       {/* Простой пример блоков, позже перенесём всю сложную разметку */}
// // //       {txt(0) && (
// // //         <section className="mb-8 md:mb-12">
// // //           <Prose className="max-w-[760px] mx-auto"><p className="mb-0">{txt(0)}</p></Prose>
// // //         </section>
// // //       )}

// // //       {img(1) && (
// // //         <section className="mb-8 md:mb-12">
// // //           <Figure src={img(1)} alt={`${item.name} 2`} />
// // //         </section>
// // //       )}

// // //       {a.wbLink && (
// // //         <footer className="max-w-[760px] mx-auto border-t border-black/10 pt-8 md:pt-10 pb-8 mb-24">
// // //           <div className="text-xs md:text-sm opacity-80 text-center">
// // //             {data.site.footerNote || "Собери капсулу из наших айтемов или обратись к нам в чат и мы в этом поможем!"}
// // //           </div>
// // //           <div className="mt-6 flex justify-center gap-4 md:gap-6">
// // //             <a
// // //               href={a.wbLink}
// // //               target="_blank"
// // //               className="px-6 md:px-8 py-3 rounded-full border border-black transition-all hover:bg-black hover:text-white"
// // //             >
// // //               Перейти на страницу товара
// // //             </a>
// // //             {data.site.telegramLink && (
// // //               <a
// // //                 href={data.site.telegramLink}
// // //                 target="_blank"
// // //                 className="px-6 md:px-8 py-3 rounded-full border border-black transition-all hover:bg-black hover:text-white"
// // //               >
// // //                 Задать вопрос в Telegram
// // //               </a>
// // //             )}
// // //           </div>
// // //         </footer>
// // //       )}
// // //     </article>
// // //   );
// // // }
