import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './authContext';
import { Skeleton } from '../../components/ui/Skeleton';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika akun PENDING, paksa navigasi ke /pending
  if (user.status === 'PENDING' && location.pathname !== '/pending') {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
};
