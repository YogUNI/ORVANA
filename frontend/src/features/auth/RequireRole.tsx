import React from 'react';
import { Navigate } from 'react-router-dom';
import { Role } from './types';
import { useAuth, getDefaultDashboardRoute } from './authContext';

export interface RequireRoleProps {
  roles: Role[];
  children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ roles, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Jika akun PENDING, jangan izinkan akses ke dashboard operasional
  if (user.status === 'PENDING') {
    return <Navigate to="/pending" replace />;
  }

  // Periksa apakah peran pengguna cocok
  if (!roles.includes(user.role)) {
    return <Navigate to={getDefaultDashboardRoute(user.role)} replace />;
  }

  return <>{children}</>;
};
