import React from "react";
import { Routes, Route } from "react-router-dom";

import { HomePage } from "./pages/HomePage";
import { BrandPage } from "./pages/BrandPage";
import { ItemPage } from "./pages/ItemPage";
import { RegistryProvider } from "./data/RegistryProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useScrollToTopOnRoute } from "./hooks/useScrollToTopOnRoute";

import { AdminProvider } from "./data/AdminContext";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminEditor from "./pages/admin/AdminEditor";
import { RequireAdmin } from "./pages/admin/RequireAdmin";

export default function App() {
  useScrollToTopOnRoute();

  return (
    <ErrorBoundary>
      {/* Админ-контекст ОБОРАЧИВАЕТ всё приложение */}
      <AdminProvider>
        <RegistryProvider>
          <Routes>
            {/* Публичные */}
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog/:brand" element={<BrandPage />} />
            <Route path="/catalog/:brand/:slug" element={<ItemPage />} />

            {/* Старые маршруты для обратной совместимости */}
            <Route path="/brand/:brand" element={<BrandPage />} />
            <Route path="/brand/:brand/item/:slug" element={<ItemPage />} />

            {/* Админка */}
            <Route path="/admin" element={<AdminLogin />} />
            {/* <Route
              path="/admin/editor"
              element={
                <RequireAdmin>
                  <AdminEditor />
                </RequireAdmin>
              }
            /> */}
            <Route path="/admin/editor" element={<AdminEditor/>} />

            <Route path="*" element={<div className="p-6">Страница не найдена</div>} />
          </Routes>
        </RegistryProvider>
      </AdminProvider>
    </ErrorBoundary>
  );
}

// import React from "react";
// import { Routes, Route } from "react-router-dom";
// import { HomePage } from "./pages/HomePage";
// import { BrandPage } from "./pages/BrandPage";
// import { ItemPage } from "./pages/ItemPage";
// import { RegistryProvider } from "./data/RegistryProvider";
// import { ErrorBoundary } from "./components/ErrorBoundary";
// import { useScrollToTopOnRoute } from "./hooks/useScrollToTopOnRoute";
// import { AdminProvider } from "./data/AdminContext";
// import AdminLogin from "./pages/admin/AdminLogin";
// import AdminEditor from "./pages/admin/AdminEditor";
// import { RequireAdmin } from "./pages/admin/RequireAdmin";



// export default function App() {
//   useScrollToTopOnRoute();

//   return (
//     <ErrorBoundary>
//       <AdminProvider>
//         <RegistryProvider>
//           <Routes>
//             {/* публичные */}
//             <Route path="/" element={<HomePage />} />
//             <Route path="/catalog/:brand" element={<BrandPage />} />
//             <Route path="/catalog/:brand/:slug" element={<ItemPage />} />

//             {/* обратная совместимость */}
//             <Route path="/brand/:brand" element={<BrandPage />} />
//             <Route path="/brand/:brand/item/:slug" element={<ItemPage />} />

//             {/* админка */}
//             <Route path="/admin" element={<AdminLogin />} />
//             <Route
//               path="/admin/editor"
//               element={
//                 <RequireAdmin>
//                   <AdminEditor />
//                 </RequireAdmin>
//               }
//             />
//             <Route path="*" element={<div className="p-6">Страница не найдена</div>} />
//           </Routes>
//         </RegistryProvider>
//       </AdminProvider>
//     </ErrorBoundary>
//   );
// }


// // import React from "react";
// // import { RegistryProvider } from "./data/RegistryContext";
// // import { AppRoutes } from "./router/AppRoutes";

// // export default function App() {
// //   return (
// //     <RegistryProvider>
// //       <AppRoutes />
// //     </RegistryProvider>
// //   );
// // }

// // // import React from "react";
// // // import { useHashRoute } from "./router/useHashRoute";
// // // import { HomePage } from "./pages/HomePage";
// // // import { BrandPage } from "./pages/BrandPage";
// // // import { ItemPage } from "./pages/ItemPage";
// // // import { ErrorBoundary } from "./components/ErrorBoundary";
// // // import { RegistryProvider, useRegistry } from "./context/RegistryContext";

// // // export default function App() {
// // //   return (
// // //     <ErrorBoundary>
// // //       <RegistryProvider>
// // //         <AppRoutes />
// // //       </RegistryProvider>
// // //     </ErrorBoundary>
// // //   );
// // // }

// // // function AppRoutes() {
// // //   const route = useHashRoute();
// // //   const { data, loading, error } = useRegistry();

// // //   if (loading) return <div className="p-6">Загрузка…</div>;
// // //   if (error) return <div className="p-6 text-red-600">Ошибка загрузки: {error}</div>;
// // //   if (!data) return <div className="p-6">Нет данных.</div>;

// // //   if (route.name === "brand") {
// // //     return <BrandPage data={data} brandKey={route.params.brand} />;
// // //   }
// // //   if (route.name === "item") {
// // //     return <ItemPage data={data} brandKey={route.params.brand} slug={route.params.slug} />;
// // //   }
// // //   return <HomePage data={data} />;
// // // }

// // // // // src/App.tsx
// // // // import React from "react";
// // // // import { fetchRegistry } from "./services/registry";
// // // // import { useHashRoute } from "./router/useHashRoute";
// // // // import { HomePage } from "./pages/HomePage";
// // // // import { BrandPage } from "./pages/BrandPage";
// // // // import { ItemPage } from "./pages/ItemPage";
// // // // import { ErrorBoundary } from "./components/ErrorBoundary";
// // // // import type { Registry } from "./schema/registry";

// // // // export default function App() {
// // // //   const route = useHashRoute();
// // // //   const [data, setData] = React.useState<Registry | null>(null);
// // // //   const [err, setErr] = React.useState<string | null>(null);
// // // //   const [loading, setLoading] = React.useState(true);

// // // //   React.useEffect(() => {
// // // //     let alive = true;
// // // //     (async () => {
// // // //       try {
// // // //         const reg = await fetchRegistry();
// // // //         if (!alive) return;
// // // //         setData(reg);
// // // //       } catch (e: any) {
// // // //         console.error("Failed to load registry:", e);
// // // //         if (!alive) return;
// // // //         setErr(e?.message || String(e));
// // // //       } finally {
// // // //         if (alive) setLoading(false);
// // // //       }
// // // //     })();
// // // //     return () => {
// // // //       alive = false;
// // // //     };
// // // //   }, []);

// // // //   if (loading) return <div className="p-6">Загрузка…</div>;
// // // //   if (err) {
// // // //     return (
// // // //       <div className="p-6">
// // // //         <div className="font-bold mb-2">Ошибка загрузки контента</div>
// // // //         <pre className="text-xs whitespace-pre-wrap">{err}</pre>
// // // //         <div className="mt-3 text-sm">
// // // //           Проверьте доступность <a className="underline" href="/CONTENT/registry.json">/CONTENT/registry.json</a>
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }
// // // //   if (!data) return <div className="p-6">Нет данных.</div>;

// // // //   return (
// // // //     <ErrorBoundary>
// // // //       {route.name === "home"  && <HomePage  data={data} />}
// // // //       {route.name === "brand" && <BrandPage data={data} brandKey={route.params.brand} />}
// // // //       {route.name === "item"  && <ItemPage  data={data} brandKey={route.params.brand} slug={route.params.slug} />}
// // // //     </ErrorBoundary>
// // // //   );
// // // // }

// // // // // import React from "react";
// // // // // import type { Registry } from "./types/registry";

// // // // // import { fetchRegistry } from "./services/registry";
// // // // // import { useHashRoute } from "./router/useHashRoute";
// // // // // import { HomePage } from "./pages/HomePage";
// // // // // import { BrandPage } from "./pages/BrandPage";
// // // // // import { ItemPage } from "./pages/ItemPage";
// // // // // import { ErrorBoundary } from "./components/ErrorBoundary";

// // // // // export default function App() {
// // // // //   const route = useHashRoute(); // 1) всегда первый хук
// // // // //   const [data, setData] = React.useState<Registry | null>(null);
// // // // //   const [err, setErr] = React.useState<string | null>(null);
// // // // //   const [loading, setLoading] = React.useState<boolean>(true);

// // // // //   // 2) грузим реестр один раз
// // // // //   React.useEffect(() => {
// // // // //     let alive = true;
// // // // //     (async () => {
// // // // //       try {
// // // // //         setLoading(true);
// // // // //         setErr(null);
// // // // //         const reg = await fetchRegistry(); // ./CONTENT/registry.json (относительно index.html)
// // // // //         if (!alive) return;
// // // // //         setData(reg);
// // // // //       } catch (e: any) {
// // // // //         if (!alive) return;
// // // // //         console.error("Failed to load registry:", e);
// // // // //         setErr(String(e?.message || e));
// // // // //       } finally {
// // // // //         if (!alive) return;
// // // // //         setLoading(false);
// // // // //       }
// // // // //     })();
// // // // //     return () => {
// // // // //       alive = false;
// // // // //     };
// // // // //   }, []);

// // // // //   // 3) состояния
// // // // //   if (loading) return <div className="p-6">Загрузка…</div>;
// // // // //   if (err) return <div className="p-6 text-red-600">Ошибка загрузки: {err}</div>;
// // // // //   if (!data) return <div className="p-6">Нет данных.</div>;

// // // // //   // 4) нормальный рендер по маршруту
// // // // //   return (
// // // // //     <ErrorBoundary>
// // // // //       <React.Suspense fallback={<div className="p-6">Загрузка…</div>}>
// // // // //         {route.name === "home" && <HomePage data={data} />}
// // // // //         {route.name === "brand" && <BrandPage data={data} brandKey={route.params.brand} />}
// // // // //         {route.name === "item" && (
// // // // //           <ItemPage data={data} brandKey={route.params.brand} slug={route.params.slug} />
// // // // //         )}
// // // // //         {/* fallback: если вдруг неизвестный маршрут */}
// // // // //         {!(route.name === "home" || route.name === "brand" || route.name === "item") && (
// // // // //           <HomePage data={data} />
// // // // //         )}
// // // // //       </React.Suspense>
// // // // //     </ErrorBoundary>
// // // // //   );
// // // // // }

// // // // // // src/App.tsx
// // // // // import React from "react";
// // // // // import type { Registry } from "./types/registry";

// // // // // import { fetchRegistry } from "./services/registry";
// // // // // import { useHashRoute } from "./router/useHashRoute";
// // // // // import { HomePage } from "./pages/HomePage";
// // // // // import { BrandPage } from "./pages/BrandPage";
// // // // // import { ItemPage } from "./pages/ItemPage";
// // // // // import { ErrorBoundary } from "./components/ErrorBoundary";

// // // // // export function App() {
// // // // //   // стабильный набор хуков
// // // // //   const route = useHashRoute();
// // // // //   const [data, setData] = React.useState<Registry | null>(null);
// // // // //   const [error, setError] = React.useState<Error | null>(null);
// // // // //   const [loading, setLoading] = React.useState(true);

// // // // //   React.useEffect(() => {
// // // // //     let alive = true;
// // // // //     (async () => {
// // // // //       try {
// // // // //         const d = await fetchRegistry();
// // // // //         if (!alive) return;
// // // // //         setData(d);
// // // // //       } catch (e: any) {
// // // // //         if (!alive) return;
// // // // //         setError(e instanceof Error ? e : new Error(String(e)));
// // // // //       } finally {
// // // // //         if (alive) setLoading(false);
// // // // //       }
// // // // //     })();
// // // // //     return () => { alive = false; };
// // // // //   }, []);

// // // // //   if (loading) return <div className="p-6">Загрузка…</div>;
// // // // //   if (error) {
// // // // //     return (
// // // // //       <div className="p-6 text-red-600">
// // // // //         <div className="font-bold mb-2">Ошибка загрузки контента</div>
// // // // //         <pre className="text-xs whitespace-pre-wrap">
// // // // //           {String(error.message || error)}
// // // // //         </pre>
// // // // //       </div>
// // // // //     );
// // // // //   }
// // // // //   if (!data) return <div className="p-6">Нет данных.</div>;

// // // // //   return (
// // // // //     <ErrorBoundary>
// // // // //       <React.Suspense fallback={<div className="p-6">Загрузка…</div>}>
// // // // //         {route.name === "home"  && <HomePage data={data} />}
// // // // //         {route.name === "brand" && <BrandPage data={data} brandKey={route.params.brand} />}
// // // // //         {route.name === "item"  && (
// // // // //           <ItemPage data={data} brandKey={route.params.brand} slug={route.params.slug} />
// // // // //         )}
// // // // //       </React.Suspense>
// // // // //     </ErrorBoundary>
// // // // //   );
// // // // // }

// // // // // import React from "react";
// // // // // import type { Registry } from "./types/registry";

// // // // // import { fetchRegistry } from "./services/registry";
// // // // // import { useHashRoute } from "./router/useHashRoute";
// // // // // import { HomePage } from "./pages/HomePage";
// // // // // import { BrandPage } from "./pages/BrandPage";
// // // // // import { ItemPage } from "./pages/ItemPage";
// // // // // import { ErrorBoundary } from "./components/ErrorBoundary";


// // // // // export default function App() {
// // // // //   // 1) стабильный набор хуков (порядок не меняется между рендерами)
// // // // //   const route = useHashRoute();
// // // // //   const [data, setData] = React.useState<Registry | null>(null);
// // // // //   const [err, setErr] = React.useState<string | null>(null);
// // // // //   const [loading, setLoading] = React.useState<boolean>(true);

// // // // //   if (err) {
// // // // //     return (
// // // // //       <div className="p-6">
// // // // //         <div className="font-bold mb-2">Ошибка загрузки контента</div>
// // // // //         <pre className="text-xs whitespace-pre-wrap">{String(err)}</pre>
// // // // //       </div>
// // // // //     );
// // // // //   }

// // // // //   if (!data) {
// // // // //     return <div className="p-6">Загрузка…</div>;
// // // // //   }

// // // // //   if (loading) return <div className="p-6">Загрузка…</div>;
// // // // //   if (err) return <div className="p-6 text-red-600">Ошибка загрузки: {err}</div>;
// // // // //   if (!data) return <div className="p-6">Нет данных.</div>;

// // // // //   // 3) Рендер страницы по маршруту
// // // // //   if (route.name === "brand") {
// // // // //     return <BrandPage data={data} brandKey={route.params.brand} />;
// // // // //   }
// // // // //   if (route.name === "item") {
// // // // //     return <ItemPage data={data} brandKey={route.params.brand} slug={route.params.slug} />;
// // // // //   }
// // // // //   // return <HomePage data={data} />;

// // // // //   return (
// // // // //     <ErrorBoundary>
// // // // //       <React.Suspense fallback={<div className="p-6">Загрузка…</div>}>
// // // // //         {route.name === "home" && <HomePage data={data} />}
// // // // //         {route.name === "brand" && <BrandPage data={data} brandKey={route.params.brand} />}
// // // // //         {route.name === "item" && (
// // // // //           <ItemPage data={data} brandKey={route.params.brand} slug={route.params.slug} />
// // // // //         )}
// // // // //       </React.Suspense>
// // // // //     </ErrorBoundary>
// // // // //   );

// // // // // }

// // // // // // 
// // // // // // src/App.tsx

// // // // // // export function App() {
// // // // // //   const [data, setData] = React.useState<null | Awaited<ReturnType<typeof fetchRegistry>>>(null);
// // // // // //   const [err, setErr] = React.useState<null | Error>(null);
// // // // // //   const route = useHashRoute();

// // // // // //   React.useEffect(() => {
// // // // // //     let alive = true;
// // // // // //     (async () => {
// // // // // //       try {
// // // // // //         const d = await fetchRegistry();
// // // // // //         if (alive) setData(d);
// // // // // //       } catch (e: any) {
// // // // // //         console.error("Failed to load registry:", e);
// // // // // //         if (alive) setErr(e);
// // // // // //       }
// // // // // //     })();
// // // // // //     return () => {
// // // // // //       alive = false;
// // // // // //     };
// // // // // //   }, []);

// // // // // //   if (err) {
// // // // // //     return (
// // // // // //       <div className="p-6">
// // // // // //         <div className="font-bold mb-2">Ошибка загрузки контента</div>
// // // // // //         <pre className="text-xs whitespace-pre-wrap">{String(err)}</pre>
// // // // // //       </div>
// // // // // //     );
// // // // // //   }

// // // // // //   if (!data) {
// // // // // //     return <div className="p-6">Загрузка…</div>;
// // // // // //   }

// // // // // //   return (
// // // // // //     <ErrorBoundary>
// // // // // //       <React.Suspense fallback={<div className="p-6">Загрузка…</div>}>
// // // // // //         {route.name === "home" && <HomePage data={data} />}
// // // // // //         {route.name === "brand" && <BrandPage data={data} brandKey={route.params.brand} />}
// // // // // //         {route.name === "item" && (
// // // // // //           <ItemPage data={data} brandKey={route.params.brand} slug={route.params.slug} />
// // // // // //         )}
// // // // // //       </React.Suspense>
// // // // // //     </ErrorBoundary>
// // // // // //   );
// // // // // // }
