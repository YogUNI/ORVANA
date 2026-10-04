import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { PendingPage } from '../pages/PendingPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminCommoditiesPage } from '../pages/admin/AdminCommoditiesPage';
import { AdminRecipesPage } from '../pages/admin/AdminRecipesPage';
import { AdminPricesPage } from '../pages/admin/AdminPricesPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { AdminLedgerPage } from '../pages/admin/AdminLedgerPage';
import { AdminDisputesPage } from '../pages/admin/AdminDisputesPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AuditorDashboardPage } from '../pages/auditor/AuditorDashboardPage';
import { QualityStandardsPage } from '../pages/inspector/QualityStandardsPage';
import { KitchenMenuPage } from '../pages/kitchen/KitchenMenuPage';
import { KitchenDemandPage } from '../pages/kitchen/KitchenDemandPage';
import { KitchenDemandDetailPage } from '../pages/kitchen/KitchenDemandDetailPage';
import { KitchenReceivingPage } from '../pages/kitchen/KitchenReceivingPage';
import { KitchenPaymentsPage } from '../pages/kitchen/KitchenPaymentsPage';
import { SupplierStockPage } from '../pages/supplier/SupplierStockPage';
import { SupplierHarvestPlanPage } from '../pages/supplier/SupplierHarvestPlanPage';
import { HarvestCalendarPage } from '../pages/supplier/HarvestCalendarPage';
import { SupplierOrdersPage } from '../pages/supplier/SupplierOrdersPage';
import { SupplierPaymentsPage } from '../pages/supplier/SupplierPaymentsPage';
import { CoordinatorOrdersPage } from '../pages/coordinator/CoordinatorOrdersPage';
import { CoordinatorShipmentsPage } from '../pages/coordinator/CoordinatorShipmentsPage';
import { CoordinatorShipmentDetailPage } from '../pages/coordinator/CoordinatorShipmentDetailPage';
import { QualityQueuePage } from '../pages/inspector/QualityQueuePage';
import { QualityCheckDetailPage } from '../pages/inspector/QualityCheckDetailPage';
import { BatchTracePage } from '../pages/BatchTracePage';
import { NotificationsPage } from '../pages/NotificationsPage';
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
        <Route path="/trace/:batchCode" element={<BatchTracePage />} />

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
            path="/admin/dashboard"
            element={
              <RequireRole roles={['ADMIN']}>
                <AdminDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/ledger"
            element={
              <RequireRole roles={['ADMIN']}>
                <AdminLedgerPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/disputes"
            element={
              <RequireRole roles={['ADMIN']}>
                <AdminDisputesPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
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
            path="/kitchen/receiving"
            element={
              <RequireRole roles={['KITCHEN_MANAGER', 'ADMIN']}>
                <KitchenReceivingPage />
              </RequireRole>
            }
          />
          <Route
            path="/kitchen/payments"
            element={
              <RequireRole roles={['KITCHEN_MANAGER', 'ADMIN']}>
                <KitchenPaymentsPage />
              </RequireRole>
            }
          />
          <Route
            path="/kitchen"
            element={<Navigate to="/kitchen/menu" replace />}
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
            path="/supplier/harvest-plan"
            element={
              <RequireRole roles={['SUPPLIER', 'ADMIN']}>
                <SupplierHarvestPlanPage />
              </RequireRole>
            }
          />
          <Route
            path="/supplier/calendar"
            element={
              <RequireRole roles={['SUPPLIER', 'ADMIN', 'KITCHEN_MANAGER', 'COORDINATOR', 'AUDITOR']}>
                <HarvestCalendarPage />
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
            path="/supplier/payments"
            element={
              <RequireRole roles={['SUPPLIER', 'ADMIN']}>
                <SupplierPaymentsPage />
              </RequireRole>
            }
          />
          <Route
            path="/supplier"
            element={<Navigate to="/supplier/stock" replace />}
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
            path="/inspector/queue"
            element={
              <RequireRole roles={['QUALITY_INSPECTOR', 'ADMIN']}>
                <QualityQueuePage />
              </RequireRole>
            }
          />
          <Route
            path="/inspector/check/:batchId"
            element={
              <RequireRole roles={['QUALITY_INSPECTOR', 'ADMIN']}>
                <QualityCheckDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/inspector"
            element={<Navigate to="/inspector/queue" replace />}
          />

          {/* Auditor Routes */}
          <Route
            path="/auditor/dashboard"
            element={
              <RequireRole roles={['AUDITOR', 'ADMIN']}>
                <AuditorDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/auditor/ledger"
            element={
              <RequireRole roles={['AUDITOR', 'ADMIN']}>
                <AuditorDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/auditor"
            element={<Navigate to="/auditor/dashboard" replace />}
          />

          {/* Halaman Notifikasi Umum untuk Seluruh Pengguna Login */}
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
