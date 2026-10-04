import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  FileCheck2,
  Info,
} from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportOrdersCsv = () => {
    setIsExporting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const downloadUrl = `${baseUrl}/orders/export/csv?${params.toString()}`;
      window.open(downloadUrl, '_blank');
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-surface-border pb-4">
        <h1 className="text-2xl font-serif font-bold text-pine-900 tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-pine-700" />
          Pusat Laporan & Ekspor Data Operasional
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Unduh data terstruktur untuk integrasi dengan sistem dinas, spreadsheet Excel, dan keperluan audit independen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kartu Ekspor Order CSV */}
        <Card className="p-6 bg-white shadow-soft flex flex-col justify-between border border-stone-200">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-pine-50 text-pine-800 border border-pine-200">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-pine-950">
                  Laporan Lengkap Seluruh Pesanan (CSV)
                </h3>
                <span className="text-xs text-stone-400 font-mono">Spesifikasi Dokumen docs/06 M10 P1</span>
              </div>
            </div>

            <p className="text-xs text-stone-600 font-sans leading-relaxed mb-6">
              Mengekspor seluruh riwayat pesanan (nomor order, komoditas, asal pemasok, dapur tujuan, kuantitas kg, harga per kg, total nilai komitmen, skor kecocokan algoritma, status akhir, dan kode batch resmi) yang kompatibel dengan format Microsoft Excel (UTF-8 BOM).
            </p>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-3 mb-6">
              <div className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                Filter Rentang Waktu Pembuatan Order
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-stone-500 block mb-1">
                    DARI TANGGAL
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-pine-700 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-stone-500 block mb-1">
                    SAMPAI TANGGAL
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-pine-700 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleExportOrdersCsv}
            isLoading={isExporting}
            className="w-full bg-pine-800 hover:bg-pine-900 text-white font-sans font-semibold py-2.5 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Unduh Berkas CSV Pesanan
          </Button>
        </Card>

        {/* Info Standar Data & Kepatuhan */}
        <div className="space-y-4">
          <Card className="p-6 bg-amber-50/40 border border-amber-200/70">
            <h4 className="font-serif font-bold text-pine-950 text-sm flex items-center gap-2 mb-2">
              <FileCheck2 className="w-4 h-4 text-pine-700" />
              Integritas & Format Data Laporan
            </h4>
            <ul className="text-xs text-stone-600 space-y-2 list-disc pl-4 font-sans leading-relaxed">
              <li>
                <strong>Format Angka:</strong> Kuantitas dalam kilogram (desimal 3 angka di belakang koma) dan Rupiah tanpa sen sesuai ketentuan akuntansi sistem ORVANA.
              </li>
              <li>
                <strong>Standar Enkoding:</strong> Menggunakan UTF-8 dengan Byte Order Mark (BOM) sehingga karakter bahasa Indonesia dan nama desa tampil sempurna di MS Excel dan Google Sheets.
              </li>
              <li>
                <strong>Penomoran Batch:</strong> Setiap order yang telah diterima mencantumkan kode batch resmi yang dapat ditelusuri langsung lewat tautan publik.
              </li>
            </ul>
          </Card>

          <Card className="p-6 bg-white border border-stone-200 text-xs text-stone-500 flex items-start gap-3">
            <Info className="w-5 h-5 text-pine-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-stone-800 block">Kerahasiaan Data & Audit Publik</span>
              <p className="mt-1 leading-relaxed">
                Berkas laporan ini memuat data transaksi lengkap dan hanya dapat diakses oleh akun dinas dengan peran ADMIN. Data pembayaran yang tertera telah divalidasi kebenarannya oleh sistem buku besar transaksi immutable.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
