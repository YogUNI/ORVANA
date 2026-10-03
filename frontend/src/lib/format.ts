/**
 * Format angka ke mata uang Rupiah
 * Contoh: 1250000 -> "Rp 1.250.000"
 */
export function formatRupiah(value: number | string): string {
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numeric)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(numeric);
}

/**
 * Format kuantitas kilogram dengan koma Indonesia
 * Contoh: 12.5 -> "12,5 kg", 40 -> "40 kg"
 */
export function formatKg(value: number | string): string {
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numeric)) return '0 kg';
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 3,
    minimumFractionDigits: 0,
  }).format(numeric);
  return `${formatted} kg`;
}

/**
 * Format tanggal standar Indonesia
 * Contoh: "2026-10-12" -> "12 Okt 2026"
 */
export function formatDate(dateStringOrDate: string | Date): string {
  if (!dateStringOrDate) return '-';
  const date = typeof dateStringOrDate === 'string' ? new Date(dateStringOrDate) : dateStringOrDate;
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format tanggal dan waktu standar Indonesia
 */
export function formatDateTime(dateStringOrDate: string | Date): string {
  if (!dateStringOrDate) return '-';
  const date = typeof dateStringOrDate === 'string' ? new Date(dateStringOrDate) : dateStringOrDate;
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
