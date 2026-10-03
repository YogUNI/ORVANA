/**
 * Uji kalkulasi jarak Haversine dari data seed S1 - S8 ke Dapur A (-6.6000, 106.8000)
 * Memverifikasi tabel di docs/09-seed-data.md Bagian 4 dengan toleransi ±0.05 km.
 */

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius bumi dalam km (docs/04)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

describe('Seed Data Verification: Jarak Haversine Pemasok ke Dapur A', () => {
  const kitchenA = { lat: -6.6000, lng: 106.8000 };

  const testVectors = [
    { id: 'S1', name: 'Tani Makmur', lat: -6.5460, lng: 106.8000, expectedKm: 6.0 },
    { id: 'S2', name: 'Kelompok Tani Sari', lat: -6.5370, lng: 106.9098, expectedKm: 14.0 },
    { id: 'S3', name: 'Tani Jaya', lat: -6.4561, lng: 106.5491, expectedKm: 32.0 },
    { id: 'S4', name: 'Gapoktan Harapan', lat: -6.6935, lng: 106.8543, expectedKm: 12.0 },
    { id: 'S5', name: 'Mina Lestari', lat: -6.6000, lng: 106.9811, expectedKm: 20.0 },
    { id: 'S6', name: 'Peternak Ayam Berkah', lat: -6.8113, lng: 106.7226, expectedKm: 25.0 },
    { id: 'S7', name: 'UMKM Tempe Bu Rina', lat: -6.6450, lng: 106.7216, expectedKm: 10.0 },
    { id: 'S8', name: 'Kelompok Tani Subur', lat: -6.4598, lng: 106.7185, expectedKm: 18.0 },
  ];

  testVectors.forEach(({ id, name, lat, lng, expectedKm }) => {
    it(`Jarak ${id} (${name}) ke Dapur A harus ~${expectedKm} km (toleransi ±0.05 km)`, () => {
      const actualKm = haversineKm(lat, lng, kitchenA.lat, kitchenA.lng);
      expect(Math.abs(actualKm - expectedKm)).toBeLessThanOrEqual(0.05);
    });
  });
});
