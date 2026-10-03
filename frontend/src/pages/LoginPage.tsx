import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, getDefaultDashboardRoute } from '../features/auth/authContext';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (user.status === 'PENDING') {
        navigate('/pending');
      } else {
        navigate(getDefaultDashboardRoute(user.role));
      }
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa email dan kata sandi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <span className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white font-heading font-black text-2xl shadow-sm">
            O
          </span>
          <span className="font-heading font-bold text-2xl text-gray-900 tracking-tight">
            ORVANA
          </span>
        </Link>
        <h2 className="font-heading font-bold text-xl text-gray-900">
          Masuk ke Akun Anda
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Platform Rantai Pasok Pangan Lokal Dapur Gizi Massal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-status-danger text-sm rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Alamat Email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Kata Sandi"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Masuk
              </Button>
            </form>

            <div className="mt-6 text-center text-xs sm:text-sm text-gray-500">
              Belum memiliki akun?{' '}
              <Link to="/register" className="font-medium text-brand hover:underline">
                Daftar sekarang
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
