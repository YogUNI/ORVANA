import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatKg } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Calendar,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Info,
  Layers,
} from 'lucide-react';

interface WeekColumn {
  weekIndex: number;
  weekLabel: string;
}

interface CommodityWeekStat {
  weekIndex: number;
  weekLabel: string;
  demandKg: number;
  supplyKg: number;
  ratio: number;
  status: 'DEFICIT' | 'BALANCED' | 'SURPLUS';
  statusLabel: 'Kurang' | 'Cukup' | 'Berlebih';
}

interface CommodityCalendarItem {
  commodityId: string;
  commodityName: string;
  commodityCategory: string;
  totalDemandKg: number;
  totalSupplyKg: number;
  weeks: CommodityWeekStat[];
}

interface CalendarResponse {
  weeks: WeekColumn[];
  thresholds: {
    gapLowRatio: number;
    gapHighRatio: number;
  };
  commodities: CommodityCalendarItem[];
}

export const HarvestCalendarPage: React.FC = () => {
  const [selectedWeeks, setSelectedWeeks] = useState<number>(4);

  const { data: response, isLoading } = useQuery<{ data: CalendarResponse }>({
    queryKey: ['harvest-calendar', selectedWeeks],
    queryFn: async () => {
      const res = await apiClient.get<{ data: CalendarResponse }>(
        `/harvest-calendar?weeks=${selectedWeeks}`,
      );
      return res.data;
    },
  });

  const calendarData = response?.data;
  const commodities = calendarData?.commodities || [];
  const weeks = calendarData?.weeks || [];

  const getHeatmapColor = (status: 'DEFICIT' | 'BALANCED' | 'SURPLUS') => {
    switch (status) {
      case 'DEFICIT':
        // Merah lembut / amber kemerahan (Kurang pasokan)
        return 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100/70';
      case 'BALANCED':
        // Hijau segar / emerald (Pasokan seimbang & cukup)
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70';
      case 'SURPLUS':
        // Kuning keemasan / harvest amber (Pasokan melimpah/berlebih)
        return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  const getStatusIcon = (status: 'DEFICIT' | 'BALANCED' | 'SURPLUS') => {
    switch (status) {
      case 'DEFICIT':
        return <TrendingDown className="w-3.5 h-3.5 text-red-600 inline mr-1" />;
      case 'BALANCED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />;
      case 'SURPLUS':
        return <TrendingUp className="w-3.5 h-3.5 text-amber-600 inline mr-1" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-pine-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-pine-700" />
            Kalender Panen Kolektif & Heatmap Pasokan
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Matriks agregat kebutuhan dapur gizi vs rencana panen produsen lokal per minggu untuk pemerataan produksi pangan.
          </p>
        </div>

        {/* Filter Rentang Minggu */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg border border-stone-200">
          <span className="text-xs font-semibold text-stone-500 px-2 font-sans">Rentang:</span>
          {[4, 6, 8].map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWeeks(w)}
              className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-md transition-colors ${
                selectedWeeks === w
                  ? 'bg-white text-pine-900 shadow-sm'
                  : 'text-stone-600 hover:text-pine-900'
              }`}
            >
              {w} Minggu
            </button>
          ))}
        </div>
      </div>

      {/* Legend & Penjelasan Heatmap */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3 bg-red-50/70 border border-red-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-xs font-sans font-bold text-red-900 block">
              Defisit / Kurang (Rasio &lt; 0.8)
            </strong>
            <span className="text-[11px] text-red-700 leading-tight block mt-0.5">
              Kebutuhan dapur belum terpenuhi. Peluang emas menanam komoditas ini!
            </span>
          </div>
        </Card>

        <Card className="p-3 bg-emerald-50/70 border border-emerald-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-xs font-sans font-bold text-emerald-900 block">
              Seimbang / Cukup (0.8 - 1.3)
            </strong>
            <span className="text-[11px] text-emerald-700 leading-tight block mt-0.5">
              Pasokan petani telah mencukupi kebutuhan terjadwal dapur wilayah.
            </span>
          </div>
        </Card>

        <Card className="p-3 bg-amber-50/70 border border-amber-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-xs font-sans font-bold text-amber-900 block">
              Surplus / Berlebih (Rasio &gt; 1.3)
            </strong>
            <span className="text-[11px] text-amber-700 leading-tight block mt-0.5">
              Pasokan panen melimpah. Disarankan diversifikasi atau olah simpan.
            </span>
          </div>
        </Card>
      </div>

      {/* Tabel Matriks Heatmap */}
      <Card className="p-0 overflow-hidden bg-white border border-stone-200 shadow-soft">
        <div className="p-4 border-b border-stone-200 bg-stone-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-pine-700" />
            <h2 className="font-serif font-bold text-base text-pine-950">
              Matriks Keseimbangan Pasokan (Komoditas × Minggu)
            </h2>
          </div>
          <span className="text-xs text-stone-500 font-sans">
            Satuan kuantitas: Kilogram (Kg)
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : commodities.length === 0 ? (
          <div className="p-12 text-center text-stone-400">
            <Info className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            <p className="font-medium text-stone-600">Belum ada data komoditas pangan aktif.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-100/75 border-b border-stone-200 text-stone-700 font-serif font-bold">
                  <th className="p-3.5 min-w-[180px] sticky left-0 bg-stone-100 z-10 border-r border-stone-200">
                    Komoditas Pangan
                  </th>
                  {weeks.map((wk) => (
                    <th key={wk.weekIndex} className="p-3.5 text-center min-w-[140px] border-r border-stone-200">
                      <span className="block font-bold text-pine-900 text-[13px]">{wk.weekLabel}</span>
                      <span className="text-[10px] text-stone-500 font-sans font-normal">Kebutuhan vs Pasokan</span>
                    </th>
                  ))}
                  <th className="p-3.5 text-right min-w-[130px] font-sans font-semibold">
                    Total {selectedWeeks} Minggu
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-sans">
                {commodities.map((item) => (
                  <tr key={item.commodityId} className="hover:bg-stone-50/50 transition-colors">
                    {/* Kolom Nama Komoditas */}
                    <td className="p-3.5 font-serif font-bold text-pine-950 text-sm sticky left-0 bg-white z-10 border-r border-stone-200 shadow-xs">
                      <div>
                        {item.commodityName}
                        <span className="block font-sans text-[11px] font-normal text-stone-400 mt-0.5">
                          {item.commodityCategory}
                        </span>
                      </div>
                    </td>

                    {/* Kolom-kolom Minggu (Heatmap Cells) */}
                    {item.weeks.map((w) => (
                      <td key={w.weekIndex} className="p-2 border-r border-stone-200 align-top">
                        <div
                          className={`p-2.5 rounded-lg border text-center transition-all ${getHeatmapColor(
                            w.status,
                          )}`}
                        >
                          <div className="font-sans font-bold text-xs flex items-center justify-center">
                            {getStatusIcon(w.status)}
                            {w.statusLabel}
                          </div>

                          <div className="mt-1 font-mono text-[11px] space-y-0.5">
                            <div className="text-stone-500">
                              Butuh: <strong className="text-stone-800">{formatKg(w.demandKg)}</strong>
                            </div>
                            <div className="text-stone-500">
                              Pasok: <strong className="text-stone-800">{formatKg(w.supplyKg)}</strong>
                            </div>
                          </div>

                          <div className="mt-1 pt-1 border-t border-black/5 text-[10px] font-mono font-semibold opacity-75">
                            Rasio: {w.ratio >= 99 ? '∞' : `${(w.ratio * 100).toFixed(0)}%`}
                          </div>
                        </div>
                      </td>
                    ))}

                    {/* Kolom Total */}
                    <td className="p-3.5 text-right font-mono text-xs border-stone-200 align-middle">
                      <div className="text-stone-500">
                        Butuh: <strong className="text-pine-950">{formatKg(item.totalDemandKg)}</strong>
                      </div>
                      <div className="text-stone-500 mt-0.5">
                        Pasok: <strong className="text-emerald-800">{formatKg(item.totalSupplyKg)}</strong>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
