import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/authContext';
import { Card } from '../components/ui/Card';
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
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <Card className="max-w-md w-full text-center p-8 bg-white border border-surface-border shadow-soft">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-harvest-gold flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="font-serif font-bold text-xl text-pine-950 mb-2">Menunggu Verifikasi Admin</h3>
        <div className="text-left">
          <p className="text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed font-sans text-center">
            Halo <span className="font-semibold text-pine-900">{user?.name}</span>, akun Anda telah terdaftar sebagai{' '}
            <span className="font-semibold text-pine-900">{user?.role}</span> dan saat ini sedang dalam proses verifikasi oleh Admin Dinas.
          </p>
          <div className="p-4 bg-stone-50 rounded-xl text-xs text-stone-600 mb-6 border border-stone-200/80 space-y-1">
            <p className="font-semibold text-stone-800">Catatan:</p>
            <p className="leading-relaxed">Fitur transaksi dan pengelolaan akan aktif segera setelah admin dinas menyetujui pendaftaran Anda.</p>
          </div>
          <Button
            variant="outline"
            size="md"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 font-sans font-semibold text-stone-700 hover:text-stone-900"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};
