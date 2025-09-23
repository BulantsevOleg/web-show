import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useRegistry } from "../data/RegistryContext";
import { HomePage } from "../pages/HomePage";
import { BrandPage } from "../pages/BrandPage";
import { ItemPage } from "../pages/ItemPage";
import { ErrorBoundary } from "../components/ErrorBoundary";

export function AppRoutes() {
  const { data, loading, error } = useRegistry();

  if (loading) return <div className="p-6">Загрузка…</div>;
  if (error) return <div className="p-6 text-red-600">Ошибка загрузки: {String(error)}</div>;

  if (!data) return <div className="p-6">Нет данных.</div>;

  return (
    <HashRouter>
      <ErrorBoundary>
      <Routes>
            {/* Главная */}
            <Route path="/" element={<HomePage />} />

            {/* КАНОНИЧЕСКИЕ НОВЫЕ ПУТИ */}
            <Route path="/catalog/:brand" element={<BrandPage />} />
            <Route path="/catalog/:brand/:slug" element={<ItemPage />} />

            {/* Обратная совместимость (короткие старые → новые) */}
            <Route path="/:brand" element={<Navigate to="/catalog/:brand" replace />} />
            <Route path="/:brand/:slug" element={<Navigate to="/catalog/:brand/:slug" replace />} />

            {/* Обратная совместимость (самые старые → новые) */}
            <Route path="/brand/:brand" element={<Navigate to="/catalog/:brand" replace />} />
            <Route path="/brand/:brand/item/:slug" element={<Navigate to="/catalog/:brand/:slug" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </ErrorBoundary>
    </HashRouter>
  );
}
