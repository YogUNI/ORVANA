export type BadgeColor = 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent';

export interface StatusMeta {
  label: string;
  color: BadgeColor;
}

// Label Status Pesanan (docs/03 bagian 2 & docs/07 bagian 5)
export const ORDER_STATUS_LABELS: Record<string, StatusMeta> = {
  PROPOSED: { label: 'Menunggu jawaban', color: 'info' },
  ACCEPTED: { label: 'Disanggupi', color: 'success' },
  REJECTED: { label: 'Ditolak', color: 'neutral' },
  EXPIRED: { label: 'Kedaluwarsa', color: 'neutral' },
  CONSOLIDATED: { label: 'Siap dikirim', color: 'info' },
  IN_TRANSIT: { label: 'Dalam perjalanan', color: 'accent' },
  RECEIVED: { label: 'Diterima, menunggu QC', color: 'warning' },
  QC_PASSED: { label: 'Lolos mutu', color: 'success' },
  QC_PARTIAL: { label: 'Lolos sebagian', color: 'warning' },
  QC_FAILED: { label: 'Ditolak mutu', color: 'danger' },
  DISPUTED: { label: 'Sengketa', color: 'danger' },
  PAID: { label: 'Dibayar (tercatat)', color: 'success' },
  COMPLETED: { label: 'Selesai', color: 'neutral' },
  CANCELLED: { label: 'Dibatalkan', color: 'neutral' },
};

// Label Status Penawaran Stok (docs/05)
export const OFFER_STATUS_LABELS: Record<string, StatusMeta> = {
  ACTIVE: { label: 'Stok Aktif', color: 'success' },
  DEPLETED: { label: 'Habis Teralokasi', color: 'neutral' },
  CANCELLED: { label: 'Dibatalkan', color: 'neutral' },
};

// Label Status Permintaan (docs/03 bagian 3)
export const DEMAND_STATUS_LABELS: Record<string, StatusMeta> = {
  DRAFT: { label: 'Draf', color: 'neutral' },
  OPEN: { label: 'Terbuka', color: 'info' },
  MATCHING: { label: 'Proses Mencocokkan', color: 'accent' },
  PARTIALLY_FULFILLED: { label: 'Terpenuhi Sebagian', color: 'warning' },
  FULFILLED: { label: 'Terpenuhi Penuh', color: 'success' },
  CANCELLED: { label: 'Dibatalkan', color: 'neutral' },
};

// Label Status Pengiriman (docs/03 bagian 4)
export const SHIPMENT_STATUS_LABELS: Record<string, StatusMeta> = {
  PLANNED: { label: 'Direncanakan', color: 'neutral' },
  PICKING_UP: { label: 'Penjemputan', color: 'info' },
  IN_TRANSIT: { label: 'Dalam Perjalanan', color: 'accent' },
  ARRIVED: { label: 'Tiba di Dapur', color: 'success' },
  CANCELLED: { label: 'Dibatalkan', color: 'neutral' },
};

// Label Hasil QC (docs/04 bagian 6)
export const QC_RESULT_LABELS: Record<string, StatusMeta> = {
  PASS: { label: 'Lolos Penuh', color: 'success' },
  PARTIAL: { label: 'Lolos Sebagian', color: 'warning' },
  FAIL: { label: 'Ditolak', color: 'danger' },
};

// Label Peran Pengguna (docs/02 bagian 2)
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin Dinas/Pembina',
  KITCHEN_MANAGER: 'Pengelola Dapur',
  SUPPLIER: 'Petani / Nelayan (Pemasok)',
  COORDINATOR: 'Koordinator / Pengepul',
  QUALITY_INSPECTOR: 'Pengawas Mutu',
  AUDITOR: 'Auditor Publik',
};

// Label Kategori Komoditas (docs/05)
export const COMMODITY_CATEGORY_LABELS: Record<string, string> = {
  VEGETABLE: 'Sayuran',
  FRUIT: 'Buah-buahan',
  FISH: 'Ikan & Hasil Air',
  POULTRY_EGG: 'Unggas & Telur',
  STAPLE: 'Pangan Pokok',
  PROTEIN_PROCESSED: 'Olahan Protein',
  SPICE: 'Bumbu & Rempah',
};
