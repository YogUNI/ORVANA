import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Gagal Memuat Data',
  message = 'Terjadi kendala saat mengambil data dari peladen. Silakan periksa koneksi Anda dan coba lagi.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-rose-50/50 rounded-card border border-rose-200/80 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="font-serif font-bold text-base text-rose-950 mb-1">
        {title}
      </h3>
      <p className="text-xs text-rose-700/80 max-w-sm font-sans mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="bg-white border-rose-300 text-rose-800 hover:bg-rose-50 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Coba Muat Ulang
        </Button>
      )}
    </div>
  );
};
