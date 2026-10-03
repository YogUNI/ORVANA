import { DemandPlanner, MenuItemDemandInput } from './demand-planner';

describe('DemandPlanner Unit Tests (docs/09 Bagian 5.4 Test Vectors)', () => {
  describe('ceilToTenth rounding helper', () => {
    it('membulatkan 5.25 ke atas menjadi 5.3 (vektor cabai rawit)', () => {
      expect(DemandPlanner.ceilToTenth(5.25)).toBe(5.3);
    });

    it('tidak mengubah angka yang sudah kelipatan 0.1', () => {
      expect(DemandPlanner.ceilToTenth(69.0)).toBe(69.0);
      expect(DemandPlanner.ceilToTenth(81.6)).toBe(81.6);
      expect(DemandPlanner.ceilToTenth(77.0)).toBe(77.0);
    });

    it('membulatkan 81.601 ke atas menjadi 81.7', () => {
      expect(DemandPlanner.ceilToTenth(81.601)).toBe(81.7);
    });
  });

  describe('Tabel Vektor Uji Kebutuhan Bahan 1000 Porsi (Senin s.d. Jumat)', () => {
    // Definisi Komoditas sesuai docs/09 Bagian 5.1
    const commodities = {
      beras: { id: 'c-beras', waste: 0.02 },
      lele: { id: 'c-lele', waste: 0.10 },
      bayam: { id: 'c-bayam', waste: 0.15 },
      bawangMerah: { id: 'c-bawang-merah', waste: 0.08 },
      pisang: { id: 'c-pisang', waste: 0.10 },
      telurAyam: { id: 'c-telur', waste: 0.03 },
      wortel: { id: 'c-wortel', waste: 0.08 },
      tomat: { id: 'c-tomat', waste: 0.10 },
      cabaiRawit: { id: 'c-cabai', waste: 0.05 },
      ayamPotong: { id: 'c-ayam', waste: 0.05 },
      kangkung: { id: 'c-kangkung', waste: 0.15 },
      tempe: { id: 'c-tempe', waste: 0.03 },
      nila: { id: 'c-nila', waste: 0.10 },
    };

    it('Senin (R1: 1000 porsi) menghasilkan tepat sesuai tabel docs/09', () => {
      // R1: Beras 0.08, Ikan lele 0.07, Bayam 0.06, Bawang merah 0.01, Pisang 0.07
      const input: MenuItemDemandInput = {
        portions: 1000,
        serviceDate: '2026-10-12',
        recipeItems: [
          { commodityId: commodities.beras.id, wastePercent: commodities.beras.waste, quantityPerPortion: 0.08 },
          { commodityId: commodities.lele.id, wastePercent: commodities.lele.waste, quantityPerPortion: 0.07 },
          { commodityId: commodities.bayam.id, wastePercent: commodities.bayam.waste, quantityPerPortion: 0.06 },
          { commodityId: commodities.bawangMerah.id, wastePercent: commodities.bawangMerah.waste, quantityPerPortion: 0.01 },
          { commodityId: commodities.pisang.id, wastePercent: commodities.pisang.waste, quantityPerPortion: 0.07 },
        ],
      };

      const result = DemandPlanner.calculate([input]);
      const resultMap = new Map(result.map((r) => [r.commodityId, r.needQty]));

      // Verifikasi presisi
      expect(resultMap.get(commodities.beras.id)).toBe(81.6); // 80 * 1.02
      expect(resultMap.get(commodities.lele.id)).toBe(77.0);  // 70 * 1.10
      expect(resultMap.get(commodities.bayam.id)).toBe(69.0); // 60 * 1.15
      expect(resultMap.get(commodities.bawangMerah.id)).toBe(10.8); // 10 * 1.08
      expect(resultMap.get(commodities.pisang.id)).toBe(77.0); // 70 * 1.10
    });

    it('Selasa (R2: 1000 porsi) membulatkan Cabai rawit 5.25 -> 5.3 kg', () => {
      // R2: Beras 0.08, Telur ayam 0.06, Wortel 0.05, Tomat 0.02, Cabai rawit 0.005, Bawang merah 0.01
      const input: MenuItemDemandInput = {
        portions: 1000,
        serviceDate: '2026-10-13',
        recipeItems: [
          { commodityId: commodities.beras.id, wastePercent: commodities.beras.waste, quantityPerPortion: 0.08 },
          { commodityId: commodities.telurAyam.id, wastePercent: commodities.telurAyam.waste, quantityPerPortion: 0.06 },
          { commodityId: commodities.wortel.id, wastePercent: commodities.wortel.waste, quantityPerPortion: 0.05 },
          { commodityId: commodities.tomat.id, wastePercent: commodities.tomat.waste, quantityPerPortion: 0.02 },
          { commodityId: commodities.cabaiRawit.id, wastePercent: commodities.cabaiRawit.waste, quantityPerPortion: 0.005 },
          { commodityId: commodities.bawangMerah.id, wastePercent: commodities.bawangMerah.waste, quantityPerPortion: 0.01 },
        ],
      };

      const result = DemandPlanner.calculate([input]);
      const resultMap = new Map(result.map((r) => [r.commodityId, r.needQty]));

      expect(resultMap.get(commodities.beras.id)).toBe(81.6); // 80 * 1.02
      expect(resultMap.get(commodities.telurAyam.id)).toBe(61.8); // 60 * 1.03
      expect(resultMap.get(commodities.wortel.id)).toBe(54.0); // 50 * 1.08
      expect(resultMap.get(commodities.tomat.id)).toBe(22.0); // 20 * 1.10
      expect(resultMap.get(commodities.cabaiRawit.id)).toBe(5.3); // 5 * 1.05 = 5.25 -> 5.3!
      expect(resultMap.get(commodities.bawangMerah.id)).toBe(10.8); // 10 * 1.08
    });

    it('Rabu (R3: 1000 porsi) tepat sesuai dokumen', () => {
      // R3: Beras 0.08, Ayam potong 0.07, Kangkung 0.06, Wortel 0.03, Bawang merah 0.01, Pisang 0.07
      const input: MenuItemDemandInput = {
        portions: 1000,
        serviceDate: '2026-10-14',
        recipeItems: [
          { commodityId: commodities.beras.id, wastePercent: commodities.beras.waste, quantityPerPortion: 0.08 },
          { commodityId: commodities.ayamPotong.id, wastePercent: commodities.ayamPotong.waste, quantityPerPortion: 0.07 },
          { commodityId: commodities.kangkung.id, wastePercent: commodities.kangkung.waste, quantityPerPortion: 0.06 },
          { commodityId: commodities.wortel.id, wastePercent: commodities.wortel.waste, quantityPerPortion: 0.03 },
          { commodityId: commodities.bawangMerah.id, wastePercent: commodities.bawangMerah.waste, quantityPerPortion: 0.01 },
          { commodityId: commodities.pisang.id, wastePercent: commodities.pisang.waste, quantityPerPortion: 0.07 },
        ],
      };

      const result = DemandPlanner.calculate([input]);
      const resultMap = new Map(result.map((r) => [r.commodityId, r.needQty]));

      expect(resultMap.get(commodities.beras.id)).toBe(81.6);
      expect(resultMap.get(commodities.ayamPotong.id)).toBe(73.5); // 70 * 1.05
      expect(resultMap.get(commodities.kangkung.id)).toBe(69.0);   // 60 * 1.15
      expect(resultMap.get(commodities.wortel.id)).toBe(32.4);     // 30 * 1.08
      expect(resultMap.get(commodities.bawangMerah.id)).toBe(10.8); // 10 * 1.08
      expect(resultMap.get(commodities.pisang.id)).toBe(77.0);     // 70 * 1.10
    });

    it('Kamis (R4: 1000 porsi) tepat sesuai dokumen', () => {
      // R4: Beras 0.08, Tempe 0.05, Telur ayam 0.06, Bayam 0.05, Wortel 0.02
      const input: MenuItemDemandInput = {
        portions: 1000,
        serviceDate: '2026-10-15',
        recipeItems: [
          { commodityId: commodities.beras.id, wastePercent: commodities.beras.waste, quantityPerPortion: 0.08 },
          { commodityId: commodities.tempe.id, wastePercent: commodities.tempe.waste, quantityPerPortion: 0.05 },
          { commodityId: commodities.telurAyam.id, wastePercent: commodities.telurAyam.waste, quantityPerPortion: 0.06 },
          { commodityId: commodities.bayam.id, wastePercent: commodities.bayam.waste, quantityPerPortion: 0.05 },
          { commodityId: commodities.wortel.id, wastePercent: commodities.wortel.waste, quantityPerPortion: 0.02 },
        ],
      };

      const result = DemandPlanner.calculate([input]);
      const resultMap = new Map(result.map((r) => [r.commodityId, r.needQty]));

      expect(resultMap.get(commodities.beras.id)).toBe(81.6);
      expect(resultMap.get(commodities.tempe.id)).toBe(51.5);     // 50 * 1.03
      expect(resultMap.get(commodities.telurAyam.id)).toBe(61.8); // 60 * 1.03
      expect(resultMap.get(commodities.bayam.id)).toBe(57.5);     // 50 * 1.15
      expect(resultMap.get(commodities.wortel.id)).toBe(21.6);    // 20 * 1.08
    });

    it('Jumat (R5: 1000 porsi) membulatkan Cabai rawit 5.25 -> 5.3 kg', () => {
      // R5: Beras 0.08, Ikan nila 0.08, Kangkung 0.04, Tomat 0.04, Cabai rawit 0.005, Pisang 0.07
      const input: MenuItemDemandInput = {
        portions: 1000,
        serviceDate: '2026-10-16',
        recipeItems: [
          { commodityId: commodities.beras.id, wastePercent: commodities.beras.waste, quantityPerPortion: 0.08 },
          { commodityId: commodities.nila.id, wastePercent: commodities.nila.waste, quantityPerPortion: 0.08 },
          { commodityId: commodities.kangkung.id, wastePercent: commodities.kangkung.waste, quantityPerPortion: 0.04 },
          { commodityId: commodities.tomat.id, wastePercent: commodities.tomat.waste, quantityPerPortion: 0.04 },
          { commodityId: commodities.cabaiRawit.id, wastePercent: commodities.cabaiRawit.waste, quantityPerPortion: 0.005 },
          { commodityId: commodities.pisang.id, wastePercent: commodities.pisang.waste, quantityPerPortion: 0.07 },
        ],
      };

      const result = DemandPlanner.calculate([input]);
      const resultMap = new Map(result.map((r) => [r.commodityId, r.needQty]));

      expect(resultMap.get(commodities.beras.id)).toBe(81.6);
      expect(resultMap.get(commodities.nila.id)).toBe(88.0);      // 80 * 1.10
      expect(resultMap.get(commodities.kangkung.id)).toBe(46.0);  // 40 * 1.15
      expect(resultMap.get(commodities.tomat.id)).toBe(44.0);     // 40 * 1.10
      expect(resultMap.get(commodities.cabaiRawit.id)).toBe(5.3); // 5 * 1.05 = 5.25 -> 5.3!
      expect(resultMap.get(commodities.pisang.id)).toBe(77.0);    // 70 * 1.10
    });
  });
});
