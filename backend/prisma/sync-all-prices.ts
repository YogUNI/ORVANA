/**
 * Script sekali jalan: sinkronisasi harga Bapanas ke seluruh 32 wilayah Indonesia.
 * Jalankan: ts-node prisma/sync-all-prices.ts  (atau: npm run seed:prices)
 */
import { PrismaClient } from '@prisma/client';
import { BAPANAS_BENCHMARK_PRICES, ZONE_MULTIPLIERS } from '../src/modules/master-data/market-price-sync.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Sinkronisasi harga Bapanas ke seluruh wilayah Indonesia...\n');

  const regions    = await prisma.region.findMany({ orderBy: { province: 'asc' } });
  const commodities = await prisma.commodity.findMany({ where: { isActive: true } });
  const admin      = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  if (!admin) throw new Error('Akun Admin tidak ditemukan. Jalankan npm run seed:demo terlebih dahulu.');

  const now        = new Date();
  const todayStr   = now.toISOString().split('T')[0];
  const validFromDate = new Date(todayStr);

  let totalUpdated = 0;

  for (const region of regions) {
    const zoneMultiplier: number = ZONE_MULTIPLIERS[region.province] ?? 1.05;
    let regionUpdated = 0;

    // Proses setiap komoditas satu per satu tanpa membungkus dalam satu transaksi besar
    for (const comm of commodities) {
      const benchmark = BAPANAS_BENCHMARK_PRICES[comm.name] ?? {
        ref: 25000, floorRatio: 0.80, ceilingRatio: 1.25,
      };

      const dayVariance    = 1 + Math.sin(now.getDate() * 0.7 + comm.name.length * 0.3) * 0.02;
      const regionVariance = 1 + Math.sin(region.name.length * 1.3 + comm.name.length) * 0.005;

      const baseRef      = benchmark.ref * zoneMultiplier * dayVariance * regionVariance;
      const refPrice     = Math.round(baseRef / 100) * 100;
      const floorPrice   = Math.round((refPrice * benchmark.floorRatio) / 100) * 100;
      const ceilingPrice = Math.round((refPrice * benchmark.ceilingRatio) / 100) * 100;

      const existing = await prisma.priceReference.findFirst({
        where: { commodityId: comm.id, regionId: region.id, validTo: null },
        orderBy: { validFrom: 'desc' },
      });

      if (existing) {
        const prevDate = new Date(existing.validFrom).toISOString().split('T')[0];
        if (prevDate === todayStr) {
          await prisma.priceReference.update({
            where: { id: existing.id },
            data: { floorPrice, referencePrice: refPrice, ceilingPrice, setById: admin.id },
          });
          regionUpdated++;
          continue;
        }
        const dayBefore = new Date(validFromDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        await prisma.priceReference.update({ where: { id: existing.id }, data: { validTo: dayBefore } });
      }

      await prisma.priceReference.create({
        data: {
          commodityId: comm.id,
          regionId:    region.id,
          floorPrice,
          referencePrice: refPrice,
          ceilingPrice,
          validFrom:   validFromDate,
          validTo:     null,
          setById:     admin.id,
        },
      });
      regionUpdated++;
    }

    totalUpdated += regionUpdated;
    const zone = ZONE_MULTIPLIERS[region.province] ?? 1.05;
    console.log(
      `  ✓ ${region.name.padEnd(30)} (${region.province.padEnd(22)}) ×${zone.toFixed(2)} → ${regionUpdated} komoditas`
    );
  }

  console.log(`\n✅ Selesai! ${totalUpdated} entri harga diperbarui di ${regions.length} wilayah Indonesia.`);
}

main()
  .catch((e) => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
