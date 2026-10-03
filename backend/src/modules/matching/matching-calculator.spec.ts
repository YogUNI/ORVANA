import { calculateMatchScore } from './matching-calculator';
import { calculateHaversineDistance } from '../../common/utils/haversine';

describe('Matching Scoring Unit Tests (docs/09 Bagian 6 Test Vectors)', () => {
  describe('Haversine Distance', () => {
    it('menghitung jarak terdekat Dapur A ke S1 (-6.6000, 106.8000 ke -6.5460, 106.8000) ~ 6.0 km', () => {
      const distance = calculateHaversineDistance(
        -6.546,
        106.8,
        -6.6,
        106.8,
      );
      // Selisih lintang 0.054 deg * 111.19 km ~ 6.00 km
      expect(Math.abs(distance - 6.0)).toBeLessThanOrEqual(0.05);
    });
  });

  describe('Tabel Vektor Uji Skenario Bayam Dapur A (docs/09 Bagian 6)', () => {
    const maxRadiusKm = 50;
    const referencePrice = 8000;
    const shelfLifeDays = 3;
    const weights = {
      distance: 0.3,
      quality: 0.3,
      price: 0.2,
      freshness: 0.1,
      reliability: 0.1,
    };

    it('Pemasok S1 menghasilkan sJarak=0.88, sMutu=0.88, sHarga=1.000, sKesegaran=0.6667, sKeandalan=0.95 -> Skor 88.97', () => {
      const score = calculateMatchScore(
        6, // jarak 6 km
        maxRadiusKm,
        88, // mutu 88
        8000, // harga ajuan 8.000
        referencePrice,
        1, // umur 1 hari
        shelfLifeDays,
        0.95, // keandalan 0.95
        weights,
      );

      expect(score.sDistance).toBe(0.88);
      expect(score.sQuality).toBe(0.88);
      expect(score.sPrice).toBe(1.0);
      expect(score.sFreshness).toBeCloseTo(0.6667, 4);
      expect(score.sReliability).toBe(0.95);
      expect(score.matchScore).toBe(88.97);
    });

    it('Pemasok S2 menghasilkan sJarak=0.72, sMutu=0.80, sHarga=1.000, sKesegaran=1.000, sKeandalan=0.80 -> Skor 83.60', () => {
      const score = calculateMatchScore(
        14, // jarak 14 km
        maxRadiusKm,
        80, // mutu 80
        7500, // harga ajuan 7.500 (di bawah acuan)
        referencePrice,
        0, // umur 0 hari (panen hari D)
        shelfLifeDays,
        0.8, // keandalan 0.80
        weights,
      );

      expect(score.sDistance).toBe(0.72);
      expect(score.sQuality).toBe(0.8);
      expect(score.sPrice).toBe(1.0);
      expect(score.sFreshness).toBe(1.0);
      expect(score.sReliability).toBe(0.8);
      expect(score.matchScore).toBe(83.6);
    });

    it('Pemasok S3 menghasilkan sJarak=0.36, sMutu=0.92, sHarga=0.875, sKesegaran=0.3333, sKeandalan=0.90 -> Skor 68.23', () => {
      // Perhitungan sHarga: 1 - (9000 - 8000)/8000 = 0.875
      const score = calculateMatchScore(
        32, // jarak 32 km
        maxRadiusKm,
        92, // mutu 92
        9000, // harga ajuan 9.000 (di atas acuan)
        referencePrice,
        2, // umur 2 hari
        shelfLifeDays,
        0.9, // keandalan 0.90
        weights,
      );

      expect(score.sDistance).toBe(0.36);
      expect(score.sQuality).toBe(0.92);
      expect(score.sPrice).toBe(0.875);
      expect(score.sFreshness).toBeCloseTo(0.3333, 4);
      expect(score.sReliability).toBe(0.9);
      expect(score.matchScore).toBe(68.23);
    });
  });
});
