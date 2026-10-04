import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { PendingPage } from '../pages/PendingPage';
import { RolePlaceholderPage } from '../pages/RolePlaceholderPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminCommoditiesPage } from '../pages/admin/AdminCommoditiesPage';
import { AdminRecipesPage } from '../pages/admin/AdminRecipesPage';
import { AdminPricesPage } from '../pages/admin/AdminPricesPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { QualityStandardsPage } from '../pages/inspector/QualityStandardsPage';
import { KitchenMenuPage } from '../pages/kitchen/KitchenMenuPage';
import { KitchenDemandPage } from '../pages/kitchen/KitchenDemandPage';
import { KitchenDemandDetailPage } from '../pages/kitchen/KitchenDemandDetailPage';
import { SupplierStockPage } from '../pages/supplier/SupplierStockPage';
import { SupplierOrdersPage } from '../pages/supplier/SupplierOrdersPage';
import { CoordinatorOrdersPage } from '../pages/coordinator/CoordinatorOrdersPage';
import { CoordinatorShipmentsPage } from '../pages/coordinator/CoordinatorShipmentsPage';
import { CoordinatorShipmentDetailPage } from '../pages/coordinator/CoordinatorShipmentDetailPage';
import { RoleLayout } from './layouts/RoleLayout';
import { RequireAuth } from '../features/auth/RequireAuth';
import { RequireRole } from '../features/auth/RequireRole';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/trace/:batchCode"
          element={
            <RolePlaceholderPage
              title="Penelusuran Batch Publik"
              roleDescription="Halaman informasi asal bahan, panen, dan uji mutu publik."
            />
          }
        />

        {/* Halaman Akun Pending */}
        <Route
          path="/pending"
          element={
            <RequireAuth>
              <PendingPage />
            </RequireAuth>
          }
        />

        {/* Rute Terlindungi dengan RoleLayout */}
        <Route
          element={
            <RequireAuth>
              <RoleLayout />
            </RequireAuth>
          }
        >
          {/* Admin Routes */}
          <Route
            path="/admin/users"
            element={
              <RequireRole roles={['ADMIN']}>
                <AdminUsersPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/master/commodities"
            element={
              <RequireRole roles={['ADMIN']}>
                <AdminCommoditiesPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/master/recipes"
            element={
              <RequireRole roles={['ADMIN']}>
                <AdminRecipesPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/master/prices"
            element={
              <RequireRole roles={['ADMIN']}>
                <AdminPricesPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RequireRole roles={['ADMIN']}>
                <AdminSettingsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/*"
            element={
              <RequireRole roles={['ADMIN']}>
                <RolePlaceholderPage
                  title="Dashboard Admin Wilayah"
                  roleDescription="Fitur pengaturan sistem, harga acuan, dan audit (Tahap 2)."
                />
              </RequireRole>
            }
          />

          {/* Kitchen Manager Routes */}
          <Route
            path="/kitchen/menu"
            element={
              <RequireRole roles={['KITCHEN_MANAGER', 'ADMIN']}>
                <KitchenMenuPage />
              </RequireRole>
            }
          />
          <Route
            path="/kitchen/demand"
            element={
              <RequireRole roles={['KITCHEN_MANAGER', 'ADMIN']}>
                <KitchenDemandPage />
              </RequireRole>
            }
          />
          <Route
            path="/kitchen/demand/:id"
            element={
              <RequireRole roles={['KITCHEN_MANAGER', 'ADMIN']}>
                <KitchenDemandDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/kitchen"
            element={<Navigate to="/kitchen/menu" replace />}
          />
          <Route
            path="/kitchen/*"
            element={
              <RequireRole roles={['KITCHEN_MANAGER']}>
                <RolePlaceholderPage
                  title="Dashboard Pengelola Dapur"
                  roleDescription="Fitur penerimaan pesanan dan pembayaran dapur (Tahap 5)."
                />
              </RequireRole>
            }
          />

          {/* Supplier Routes */}
          <Route
            path="/supplier/stock"
            element={
              <RequireRole roles={['SUPPLIER', 'ADMIN']}>
                <SupplierStockPage />
              </RequireRole>
            }
          />
          <Route
            path="/supplier/orders"
            element={
              <RequireRole roles={['SUPPLIER', 'ADMIN']}>
                <SupplierOrdersPage />
              </RequireRole>
            }
          />
          <Route
            path="/supplier"
            element={<Navigate to="/supplier/stock" replace />}
          />
          <Route
            path="/supplier/*"
            element={
              <RequireRole roles={['SUPPLIER']}>
                <RolePlaceholderPage
                  title="Dashboard Pemasok Pangan"
                  roleDescription="Manajemen penawaran stok dan respon tawaran pesanan (Tahap 3)."
                />
              </RequireRole>
            }
          />

          {/* Coordinator Routes */}
          <Route
            path="/coordinator/orders"
            element={
              <RequireRole roles={['COORDINATOR', 'ADMIN']}>
                <CoordinatorOrdersPage />
              </RequireRole>
            }
          />
          <Route
            path="/coordinator/shipments"
            element={
              <RequireRole roles={['COORDINATOR', 'ADMIN']}>
                <CoordinatorShipmentsPage />
              </RequireRole>
            }
          />
          <Route
            path="/coordinator/shipments/:id"
            element={
              <RequireRole roles={['COORDINATOR', 'ADMIN']}>
                <CoordinatorShipmentDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/coordinator"
            element={<Navigate to="/coordinator/shipments" replace />}
          />

          {/* Inspector Routes */}
          <Route
            path="/inspector/standards"
            element={
              <RequireRole roles={['QUALITY_INSPECTOR', 'ADMIN']}>
                <QualityStandardsPage />
              </RequireRole>
            }
          />
          <Route
            path="/inspector/*"
            element={
              <RequireRole roles={['QUALITY_INSPECTOR']}>
                <RolePlaceholderPage
                  title="Dashboard Pengawas Mutu"
                  roleDescription="Antrean pemeriksaan dan checklist hasil uji mutu bahan makanan (Tahap 5)."
                />
              </RequireRole>
            }
          />

          {/* Auditor Routes */}
          <Route
            path="/auditor/*"
            element={
              <RequireRole roles={['AUDITOR']}>
                <RolePlaceholderPage
                  title="Dashboard Auditor Publik"
                  roleDescription="Transparansi pembukuan ledger dan analisis indikator dampak lokal (Tahap 6)."
                />
              </RequireRole>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
