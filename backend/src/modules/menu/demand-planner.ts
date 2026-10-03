import { Prisma } from '@prisma/client';

export interface CommodityDemandInput {
  commodityId: string;
  name?: string;
  wastePercent: number | string | Prisma.Decimal;
  quantityPerPortion: number | string | Prisma.Decimal;
}

export interface MenuItemDemandInput {
  portions: number;
  serviceDate: Date | string;
  recipeItems: CommodityDemandInput[];
}

export interface CalculatedDemandOutput {
  commodityId: string;
  neededDate: string; // YYYY-MM-DD
  baseQty: number; // kg murni sebelum susut
  needQty: number; // kg hasil akhir (dibulatkan ke atas 0.1 kg)
  wastePercent: number;
}

/**
 * DemandPlanner
 * Mengimplementasikan rumus resmi docs/04-business-rules.md bagian 2:
 * baseQty(c,d) = Σ over MenuPlan di d: portions * quantityPerPortion(c)
 * needQty(c,d) = baseQty(c,d) * (1 + wastePercent(c))
 * dibulatkan ke atas ke 0.1 kg terdekat (ceil 0.1)
 */
export class DemandPlanner {
  /**
   * Pembulatan ke atas kelipatan 0.1 kg (contoh: 5.25 -> 5.3)
   */
  static ceilToTenth(value: number): number {
    const factor = 10;
    // Tambahkan epsilon untuk menghindari presisi float IEEE 754
    return Math.ceil(Math.round(value * 1000) / 100) / factor;
  }

  /**
   * Hitung kebutuhan bahan dari kumpulan menu plan
   */
  static calculate(menuPlans: MenuItemDemandInput[]): CalculatedDemandOutput[] {
    // Map key: `${commodityId}_${dateKey}`
    const map = new Map<
      string,
      {
        commodityId: string;
        neededDate: string;
        baseQty: number;
        wastePercent: number;
      }
    >();

    for (const plan of menuPlans) {
      const dateObj =
        plan.serviceDate instanceof Date
          ? plan.serviceDate
          : new Date(plan.serviceDate);
      const dateKey = dateObj.toISOString().split('T')[0];

      for (const item of plan.recipeItems) {
        const key = `${item.commodityId}_${dateKey}`;
        const itemPortionQty = Number(item.quantityPerPortion);
        const itemWastePct = Number(item.wastePercent);
        const totalBaseQty = plan.portions * itemPortionQty;

        if (!map.has(key)) {
          map.set(key, {
            commodityId: item.commodityId,
            neededDate: dateKey,
            baseQty: totalBaseQty,
            wastePercent: itemWastePct,
          });
        } else {
          const current = map.get(key)!;
          current.baseQty += totalBaseQty;
        }
      }
    }

    const results: CalculatedDemandOutput[] = [];
    for (const entry of map.values()) {
      // needQty = baseQty * (1 + wastePercent)
      const rawNeedQty = entry.baseQty * (1 + entry.wastePercent);
      const needQty = this.ceilToTenth(rawNeedQty);

      results.push({
        commodityId: entry.commodityId,
        neededDate: entry.neededDate,
        baseQty: Math.round(entry.baseQty * 1000) / 1000,
        needQty,
        wastePercent: entry.wastePercent,
      });
    }

    return results;
  }
}
