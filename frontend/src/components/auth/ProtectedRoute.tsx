import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '@/context';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { currentUser } = useApp();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/rooms" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
