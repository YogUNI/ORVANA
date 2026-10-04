import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatRupiah } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  MapPin,
  Clock,
  ShieldCheck,
  Building,
  Scale,
  DollarSign,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix icon bawaan Leaflet pada Vite / Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ImpactMetrics {
  localSpendingRupiah: number;
  producersInvolved: number;
  fulfillmentRatePct: number;
  rejectionRatePct: number;
  qualityPassRatePct: number;
  avgDistanceKm: number;
  pricePremiumPct: number;
  onTimeDeliveryPct: number;
  escrowHoldRupiah: number;
  meta: {
    totalOrders: number;
    totalBatches: number;
    totalDemandKg: number;
    totalAcceptedKg: number;
    totalRejectedKg: number;
  };
}

const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

export const AdminDashboardPage: React.FC = () => {
  const { data: metricsResponse, isLoading } = useQuery<{ data: ImpactMetrics }>({
    queryKey: ['impact-metrics'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: ImpactMetrics }>('/dashboard/impact');
      return res.data;
    },
  });

  const metrics = metricsResponse?.data;

  // Data untuk Bar Chart: Pemenuhan vs Penolakan Bahan Pangan
  const volumeData = metrics
    ? [
        {
          name: 'Total Pasokan',
          Diterima: metrics.meta.totalAcceptedKg,
          Ditolak: metrics.meta.totalRejectedKg,
        },
      ]
    : [];

  // Data untuk Pie Chart: Proporsi Lolos Mutu vs Penolakan
  const qualityData = metrics
    ? [
        { name: 'Bahan Lolos Prima', value: metrics.meta.totalAcceptedKg },
        { name: 'Bahan Ditolak Sortir', value: metrics.meta.totalRejectedKg },
      ]
    : [];

  // Koordinat Dapur A dan Pemasok lokal untuk visualisasi peta rantai pasok
  const kitchenCoord: [number, number] = [-6.9175, 107.6191]; // Dapur A (Pusat)
  const supplierCoords: Array<{ name: string; position: [number, number]; commodity: string }> = [
    { name: 'S1 Tani Mandiri', position: [-6.88, 107.6], commodity: 'Bayam' },
    { name: 'S2 Berkah Tani', position: [-6.8, 107.65], commodity: 'Wortel' },
    { name: 'S5 Mina Lestari', position: [-6.75, 107.61], commodity: 'Ikan Lele' },
    { name: 'S6 Peternak Berkah', position: [-7.1, 107.5], commodity: 'Telur Ayam' },
    { name: 'S7 UMKM Tempe Bu Rina', position: [-6.85, 107.62], commodity: 'Tempe' },
    { name: 'S8 Kelompok Tani Subur', position: [-6.78, 107.68], commodity: 'Beras' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Dashboard Dampak & Rantai Pasok Wilayah
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Indikator dampak ekonomi lokal, kepatuhan gizi massal, efisiensi logistik, dan akuntabilitas anggaran APBD.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="success">Data Terverifikasi Real-Time</Badge>
        </div>
      </div>

      {/* Grid 9 Kartu Indikator Dampak (docs/04 bagian 10) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Belanja Lokal */}
        <Card className="p-4 border-l-4 border-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Nilai Belanja Lokal
            </p>
            <p className="text-2xl font-heading font-bold text-emerald-600 mt-1">
              {isLoading ? <Skeleton className="h-7 w-28" /> : formatRupiah(metrics?.localSpendingRupiah || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Tersalurkan ke produsen sewilayah</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
        </Card>

        {/* 2. Produsen Terlibat */}
        <Card className="p-4 border-l-4 border-blue-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Produsen Lokal Terlibat
            </p>
            <p className="text-2xl font-heading font-bold text-gray-900 mt-1">
              {isLoading ? <Skeleton className="h-7 w-16" /> : `${metrics?.producersInvolved || 0} Produsen`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Petani, nelayan & UMKM aktif</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
        </Card>

        {/* 3. Tingkat Pemenuhan */}
        <Card className="p-4 border-l-4 border-brand flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Tingkat Pemenuhan Gizi
            </p>
            <p className="text-2xl font-heading font-bold text-brand mt-1">
              {isLoading ? <Skeleton className="h-7 w-20" /> : `${metrics?.fulfillmentRatePct || 0}%`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Dari total kuantitas menu terjadwal</p>
          </div>
          <div className="p-3 bg-brand-soft text-brand rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>

        {/* 4. Tingkat Lolos Mutu */}
        <Card className="p-4 border-l-4 border-teal-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Tingkat Kelulusan Mutu
            </p>
            <p className="text-2xl font-heading font-bold text-teal-600 mt-1">
              {isLoading ? <Skeleton className="h-7 w-20" /> : `${metrics?.qualityPassRatePct || 0}%`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Batch berstatus PASS inspeksi</p>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </Card>

        {/* 5. Tingkat Penolakan */}
        <Card className="p-4 border-l-4 border-rose-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Tingkat Penolakan Bahan
            </p>
            <p className="text-2xl font-heading font-bold text-rose-600 mt-1">
              {isLoading ? <Skeleton className="h-7 w-20" /> : `${metrics?.rejectionRatePct || 0}%`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Sortiran afkir / cacat mutu</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </Card>

        {/* 6. Jarak Tempuh Rata-Rata */}
        <Card className="p-4 border-l-4 border-indigo-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Jarak Tempuh Rata-rata
            </p>
            <p className="text-2xl font-heading font-bold text-indigo-600 mt-1">
              {isLoading ? <Skeleton className="h-7 w-20" /> : `${metrics?.avgDistanceKm || 0} km`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Rantai pasok pangan pendek</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <MapPin className="w-6 h-6" />
          </div>
        </Card>

        {/* 7. Ketepatan Waktu */}
        <Card className="p-4 border-l-4 border-amber-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Ketepatan Waktu Distribusi
            </p>
            <p className="text-2xl font-heading font-bold text-amber-600 mt-1">
              {isLoading ? <Skeleton className="h-7 w-20" /> : `${metrics?.onTimeDeliveryPct || 0}%`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Armada tiba sesuai jadwal saji</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        {/* 8. Premi Harga vs Acuan */}
        <Card className="p-4 border-l-4 border-cyan-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Premi Harga vs Acuan
            </p>
            <p className="text-2xl font-heading font-bold text-cyan-600 mt-1">
              {isLoading ? <Skeleton className="h-7 w-20" /> : `${(metrics?.pricePremiumPct || 0) > 0 ? '+' : ''}${metrics?.pricePremiumPct || 0}%`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Deviasi terhadap standar dinas</p>
          </div>
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-lg">
            <Scale className="w-6 h-6" />
          </div>
        </Card>

        {/* 9. Dana Tertahan (Escrow HOLD) */}
        <Card className="p-4 border-l-4 border-purple-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Nilai Dana Tertahan (HOLD)
            </p>
            <p className="text-2xl font-heading font-bold text-purple-600 mt-1">
              {isLoading ? <Skeleton className="h-7 w-28" /> : formatRupiah(metrics?.escrowHoldRupiah || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Dalam proses kirim / inspeksi</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Building className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Visualisasi Grafik Recharts: Pemenuhan & Mutu */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik Volume Pasokan */}
        <Card className="p-5">
          <h2 className="font-heading font-semibold text-gray-900 text-sm mb-4">
            Realisasi Volume Pasokan: Diterima vs Ditolak (kg)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value ?? 0} kg`, '']} />
                <Legend />
                <Bar dataKey="Diterima" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ditolak" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Grafik Proporsi Mutu */}
        <Card className="p-5">
          <h2 className="font-heading font-semibold text-gray-900 text-sm mb-4">
            Proporsi Kualitas Bahan Pangan Diterima
          </h2>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={qualityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {qualityData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value ?? 0} kg`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Peta Geospasial Interaktif Koridor Pasokan Pendek (React Leaflet) */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="font-heading font-semibold text-gray-900 text-sm">
              Peta Koridor Rantai Pasok Pangan Lokal (Radius &lt; 25 km)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Jalur distribusi langsung dari produsen lokal menuju Dapur Gizi Sehat Bandung 01.
            </p>
          </div>
          <Badge color="info">Haversine Smart Geo-Routing</Badge>
        </div>

        <div className="h-80 w-full rounded-lg overflow-hidden border border-gray-200 z-0">
          <MapContainer
            center={kitchenCoord}
            zoom={10}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Marker Dapur */}
            <Marker position={kitchenCoord}>
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-gray-900">Dapur Gizi Demo A (DPR01)</p>
                  <p className="text-gray-600">Pusat Pengolahan Makanan Bergizi</p>
                  <p className="font-mono text-emerald-600 font-semibold">Kapasitas: 1.000 porsi/hari</p>
                </div>
              </Popup>
            </Marker>

            {/* Marker & Garis Pasokan Produsen */}
            {supplierCoords.map((sup, idx) => (
              <React.Fragment key={idx}>
                <Marker position={sup.position}>
                  <Popup>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-gray-900">{sup.name}</p>
                      <p className="text-gray-600">Komoditas: {sup.commodity}</p>
                      <p className="text-blue-600 font-medium">Produsen Pangan Terverifikasi</p>
                    </div>
                  </Popup>
                </Marker>
                <Polyline
                  positions={[sup.position, kitchenCoord]}
                  pathOptions={{ color: '#10B981', weight: 2, dashArray: '5, 8' }}
                />
              </React.Fragment>
            ))}
          </MapContainer>
        </div>
      </Card>
    </div>
  );
};
