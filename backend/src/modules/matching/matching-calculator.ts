export interface MatchingWeights {
  distance: number;
  quality: number;
  price: number;
  freshness: number;
  reliability: number;
}

export interface ScoreComponents {
  sDistance: number;
  sQuality: number;
  sPrice: number;
  sFreshness: number;
  sReliability: number;
  matchScore: number;
}

/**
 * Menghitung komponen skor dan skor total kecocokan (0 s.d. 100)
 * docs/04 bagian 4.2 & docs/09 bagian 6
 */
export function calculateMatchScore(
  distanceKm: number,
  maxRadiusKm: number,
  qualityScore: number,
  askingPrice: number,
  referencePrice: number,
  ageDays: number,
  shelfLifeDays: number,
  reliabilityRate: number,
  weights: MatchingWeights = {
    distance: 0.3,
    quality: 0.3,
    price: 0.2,
    freshness: 0.1,
    reliability: 0.1,
  },
): ScoreComponents {
  // 1. Skor Jarak: sDistance = max(0, 1 - distanceKm / maxRadiusKm)
  const sDistance = Math.max(0, 1 - distanceKm / maxRadiusKm);

  // 2. Skor Mutu: sQuality = qualityScore / 100
  const sQuality = qualityScore / 100;

  // 3. Skor Harga:
  // sPrice = askingPrice <= referencePrice ? 1 : max(0, 1 - (askingPrice - referencePrice) / referencePrice)
  const sPrice =
    askingPrice <= referencePrice
      ? 1
      : Math.max(0, 1 - (askingPrice - referencePrice) / referencePrice);

  // 4. Skor Kesegaran: sFreshness = 1 - age / shelfLifeDays
  const sFreshness = Math.max(0, 1 - ageDays / shelfLifeDays);

  // 5. Skor Keandalan: sReliability = supplier.reliabilityRate
  const sReliability = reliabilityRate;

  // Total Skor
  const rawScore =
    100 *
    (weights.distance * sDistance +
      weights.quality * sQuality +
      weights.price * sPrice +
      weights.freshness * sFreshness +
      weights.reliability * sReliability);

  // Bulatkan 2 desimal
  const matchScore = Math.round(rawScore * 100) / 100;

  return {
    sDistance: Math.round(sDistance * 10000) / 10000,
    sQuality: Math.round(sQuality * 10000) / 10000,
    sPrice: Math.round(sPrice * 10000) / 10000,
    sFreshness: Math.round(sFreshness * 10000) / 10000,
    sReliability: Math.round(sReliability * 10000) / 10000,
    matchScore,
  };
}
