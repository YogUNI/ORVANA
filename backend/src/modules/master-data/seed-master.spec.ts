import {
  COMMODITIES_SEED_DATA,
  DEFAULT_QUALITY_CHECKLIST,
  RECIPES_SEED_DATA,
} from '../../../prisma/seed-master.data';

describe('Master Data Seed Specifications (docs/09 Bagian 5)', () => {
  describe('5.1 Komoditas & Standar Mutu & Harga Acuan', () => {
    it('harus memiliki tepat 13 komoditas', () => {
      expect(COMMODITIES_SEED_DATA).toHaveLength(13);
    });

    it('setiap komoditas harus memiliki satuan kg', () => {
      COMMODITIES_SEED_DATA.forEach((c) => {
        expect(c.unit).toBe('kg');
      });
    });

    it('setiap harga acuan harus memenuhi invarian matematis: floorPrice <= referencePrice <= ceilingPrice', () => {
      COMMODITIES_SEED_DATA.forEach((c) => {
        expect(c.floorPrice).toBeLessThanOrEqual(c.referencePrice);
        expect(c.referencePrice).toBeLessThanOrEqual(c.ceilingPrice);
        expect(c.floorPrice).toBeGreaterThan(0);
      });
    });

    it('spesifikasi harga dan susut bayam sesuai dengan skenario acuan', () => {
      const bayam = COMMODITIES_SEED_DATA.find((c) => c.name === 'Bayam');
      expect(bayam).toBeDefined();
      expect(bayam?.floorPrice).toBe(6000);
      expect(bayam?.referencePrice).toBe(8000);
      expect(bayam?.ceilingPrice).toBe(12000);
      expect(bayam?.shelfLifeDays).toBe(3);
      expect(bayam?.wastePercent).toBe(0.15);
    });

    it('checklist mutu standar harus memiliki total bobot tepat 100', () => {
      const totalWeight = DEFAULT_QUALITY_CHECKLIST.reduce(
        (sum, item) => sum + item.weight,
        0,
      );
      expect(totalWeight).toBe(100);
      expect(DEFAULT_QUALITY_CHECKLIST).toHaveLength(5);
    });
  });

  describe('5.2 Resep Baku (R1 s.d. R5)', () => {
    it('harus memiliki 5 resep baku (R1 s.d. R5)', () => {
      expect(RECIPES_SEED_DATA).toHaveLength(5);
      const recipeNames = RECIPES_SEED_DATA.map((r) => r.name);
      expect(recipeNames[0]).toMatch(/^R1/);
      expect(recipeNames[1]).toMatch(/^R2/);
      expect(recipeNames[2]).toMatch(/^R3/);
      expect(recipeNames[3]).toMatch(/^R4/);
      expect(recipeNames[4]).toMatch(/^R5/);
    });

    it('seluruh bahan pada resep harus merujuk ke komoditas yang terdaftar', () => {
      const commodityNames = new Set(COMMODITIES_SEED_DATA.map((c) => c.name));
      for (const recipe of RECIPES_SEED_DATA) {
        for (const item of recipe.items) {
          expect(commodityNames.has(item.commodityName)).toBe(true);
          expect(item.quantityPerPortion).toBeGreaterThan(0);
        }
      }
    });

    it('komposisi bahan R1 (Senin Dapur A) harus tepat sesuai dokumen', () => {
      const r1 = RECIPES_SEED_DATA.find((r) => r.name.startsWith('R1'));
      expect(r1).toBeDefined();
      const itemMap = new Map(r1?.items.map((i) => [i.commodityName, i.quantityPerPortion]));

      expect(itemMap.get('Beras')).toBe(0.08);
      expect(itemMap.get('Ikan lele')).toBe(0.07);
      expect(itemMap.get('Bayam')).toBe(0.06);
      expect(itemMap.get('Bawang merah')).toBe(0.01);
      expect(itemMap.get('Pisang')).toBe(0.07);
    });
  });
});
