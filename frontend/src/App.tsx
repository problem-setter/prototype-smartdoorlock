import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

import {
  LoginPage,
  RoomsPage,
  RoomDetailPage,
  UsersPage,
  LogsPage,
  HardwarePage,
  NotFoundPage,
} from '@/pages';

export type NavTab = 'rooms' | 'users' | 'logs' | 'hardware';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Application Routes inside AppLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/rooms" replace />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
            <Route path="/logs" element={<LogsPage />} />

            {/* Admin & Superadmin Route */}
            <Route
              path="/hardware"
              element={
                <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                  <HardwarePage />
                </ProtectedRoute>
              }
            />

            {/* Superadmin Exclusive Route */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            {/* 404 Not Found Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
