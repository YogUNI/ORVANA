import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from './types';
import { apiClient } from '../../lib/apiClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('orvana_access_token'),
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const res: any = await apiClient.get('/auth/me');
      const userData = res.data || res;
      setUser(userData);
    } catch (error) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('orvana_access_token');
      localStorage.removeItem('orvana_refresh_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshProfile();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    const res: any = await apiClient.post('/auth/login', { email, password });
    const data = res.data || res;

    localStorage.setItem('orvana_access_token', data.accessToken);
    localStorage.setItem('orvana_refresh_token', data.refreshToken);
    setToken(data.accessToken);

    // Ambil detail profil lengkap
    const meRes: any = await apiClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });
    const fullUser = meRes.data || meRes;
    setUser(fullUser);
    return fullUser;
  };

  const register = async (payload: any): Promise<any> => {
    const res: any = await apiClient.post('/auth/register', payload);
    return res.data || res;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Abaikan error logout server
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('orvana_access_token');
      localStorage.removeItem('orvana_refresh_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function getDefaultDashboardRoute(role?: Role): string {
  switch (role) {
    case 'KITCHEN_MANAGER':
      return '/kitchen';
    case 'SUPPLIER':
      return '/supplier';
    case 'COORDINATOR':
      return '/coordinator';
    case 'QUALITY_INSPECTOR':
      return '/inspector';
    case 'ADMIN':
      return '/admin/users';
    case 'AUDITOR':
      return '/auditor';
    default:
      return '/';
  }
}
