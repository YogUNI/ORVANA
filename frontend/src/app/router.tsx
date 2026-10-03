import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { RolePlaceholderPage } from '../pages/RolePlaceholderPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <RolePlaceholderPage
              title="Masuk ke Akun ORVANA"
              roleDescription="Halaman login peran pengguna (Tahap 1)."
            />
          }
        />
        <Route
          path="/register"
          element={
            <RolePlaceholderPage
              title="Pendaftaran Akun Baru"
              roleDescription="Pendaftaran pengelola dapur, pemasok, dan koordinator (Tahap 1)."
            />
          }
        />
        <Route
          path="/trace/:batchCode"
          element={
            <RolePlaceholderPage
              title="Penelusuran Batch Publik"
              roleDescription="Halaman informasi asal bahan, panen, dan uji mutu publik."
            />
          }
        />

        {/* Role Dashboards Placeholders */}
        <Route
          path="/kitchen/*"
          element={
            <RolePlaceholderPage
              title="Dashboard Pengelola Dapur"
              roleDescription="Perencanaan menu, kebutuhan bahan, dan pemantauan pesanan."
            />
          }
        />
        <Route
          path="/supplier/*"
          element={
            <RolePlaceholderPage
              title="Dashboard Pemasok"
              roleDescription="Manajemen stok, rencana panen, dan persetujuan pesanan."
            />
          }
        />
        <Route
          path="/coordinator/*"
          element={
            <RolePlaceholderPage
              title="Dashboard Koordinator"
              roleDescription="Konsolidasi pesanan dan armada pengiriman logistik."
            />
          }
        />
        <Route
          path="/inspector/*"
          element={
            <RolePlaceholderPage
              title="Dashboard Pengawas Mutu"
              roleDescription="Antrean pemeriksaan dan checklist uji mutu bahan makanan."
            />
          }
        />
        <Route
          path="/admin/*"
          element={
            <RolePlaceholderPage
              title="Dashboard Admin Wilayah"
              roleDescription="Manajemen pengguna, harga acuan komoditas, dan audit."
            />
          }
        />
        <Route
          path="/auditor/*"
          element={
            <RolePlaceholderPage
              title="Dashboard Auditor Publik"
              roleDescription="Transparansi pembukuan dan analisis dampak lokal."
            />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
