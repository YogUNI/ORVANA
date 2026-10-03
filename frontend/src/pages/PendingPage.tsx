import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/authContext';
import { Card, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Clock, LogOut } from 'lucide-react';

export const PendingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center items-center p-4">
      <Card className="max-w-md w-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-status-warning flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Clock className="w-8 h-8" />
        </div>
        <CardTitle className="text-xl mb-2">Menunggu Verifikasi Admin</CardTitle>
        <CardContent>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Halo <span className="font-semibold text-gray-800">{user?.name}</span>, akun Anda telah terdaftar sebagai{' '}
            <span className="font-semibold text-gray-800">{user?.role}</span> dan saat ini sedang dalam proses verifikasi oleh Admin Dinas.
          </p>
          <div className="p-3 bg-gray-50 rounded text-xs text-gray-500 mb-6 text-left border border-gray-200">
            <p className="font-semibold text-gray-700 mb-1">Catatan:</p>
            <p>Fitur transaksi dan pengelolaan akan aktif segera setelah admin menyetujui pendaftaran Anda.</p>
          </div>
          <Button
            variant="outline"
            size="md"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
