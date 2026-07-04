import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { DebugConnection } from './pages/DebugConnection';
import AdminDashboard from './pages/admin/AdminDashboard';
import { AdminProperties, AdminTenants, AdminTickets, AdminDocuments, AdminSettings, AdminCalendar } from './pages/admin/AdminPages';
import { TenantDashboard, TenantPayments, TenantContracts, TenantRequests } from './pages/tenant/TenantPages';
import { OwnerDashboard, OwnerProperties, OwnerRequests, OwnerCalendar } from './pages/owner/OwnerPages';
import { UserProfile } from './pages/UserProfile';
import { Layout } from './components/Layout';
import { UserRole } from './types';
import { StoreProvider } from './context/StoreContext';
import { ToastProvider } from './context/ToastContext';

import { LoadingScreen } from './components/LoadingScreen';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <StoreProvider>
        <LoadingScreen />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/debug" element={<DebugConnection />} />

            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <Layout role={UserRole.ADMIN}>
                <Routes>
                  <Route path="/" element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="properties" element={<AdminProperties />} />
                  <Route path="tenants" element={<AdminTenants />} />
                  <Route path="tickets" element={<AdminTickets />} />
                  <Route path="documents" element={<AdminDocuments />} />
                  <Route path="calendar" element={<AdminCalendar />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="profile" element={<UserProfile />} />
                </Routes>
              </Layout>
            } />

            {/* Tenant Routes */}
            <Route path="/tenant/*" element={
              <Layout role={UserRole.TENANT}>
                <Routes>
                  <Route path="/" element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<TenantDashboard />} />
                  <Route path="payments" element={<TenantPayments />} />
                  <Route path="contracts" element={<TenantContracts />} />
                  <Route path="requests" element={<TenantRequests />} />
                  <Route path="profile" element={<UserProfile />} />
                </Routes>
              </Layout>
            } />

            {/* Owner Routes */}
            <Route path="/owner/*" element={
              <Layout role={UserRole.OWNER}>
                <Routes>
                  <Route path="/" element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<OwnerDashboard />} />
                  <Route path="properties" element={<OwnerProperties />} />
                  <Route path="calendar" element={<OwnerCalendar />} />
                  <Route path="requests" element={<OwnerRequests />} />
                  <Route path="profile" element={<UserProfile />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </HashRouter>
      </StoreProvider>
    </ToastProvider>
  );
};

export default App;