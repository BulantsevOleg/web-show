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