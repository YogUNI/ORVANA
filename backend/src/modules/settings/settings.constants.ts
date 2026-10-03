/**
 * Daftar konfigurasi default resmi sistem dari docs/04-business-rules.md bagian 0
 */
export const DEFAULT_SYSTEM_SETTINGS: Record<string, any> = {
  'matching.weights': {
    distance: 0.3,
    quality: 0.3,
    price: 0.2,
    freshness: 0.1,
    reliability: 0.1,
  },
  'matching.maxRadiusKm': 50,
  'matching.maxSharePerSupplier': 0.6,
  'matching.minSupplierQuality': 60,
  'order.responseWindowHours': 12,
  'order.disputeWindowHours': 48,
  'qc.defaultPassScore': 70,
  'supplier.qualityEmaAlpha': 0.2,
  'supplier.reliabilityEmaAlpha': 0.2,
  'supplier.newReliabilityDefault': 0.8,
  'harvest.gapLowRatio': 0.8,
  'harvest.gapHighRatio': 1.3,
  'price.enforceFloor': true,
  'receive.discrepancyTolerancePct': 2,
  'ledger.hashChainEnabled': false,
};
