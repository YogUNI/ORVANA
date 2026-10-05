import { PrismaClient, OfferStatus } from '@prisma/client';

export async function seedDemoStocks(prisma: PrismaClient) {
  console.log('🥬 Menyemai stok bayam S1, S2, S3 untuk skenario demo langsung (docs/09 bagian 6)...');

  // Ambil komoditas bayam
  const bayam = await prisma.commodity.findFirst({
    where: { name: 'Bayam' },
  });
  if (!bayam) {
    console.warn('Komoditas Bayam belum ada, melewati seedDemoStocks');
    return;
  }

  // Cari supplier S1, S2, S3
  const suppliers = await prisma.supplierProfile.findMany({
    include: { user: true },
  });

  const supMap = new Map<string, string>();
  for (const s of suppliers) {
    if (s.user.email.startsWith('s1@')) supMap.set('S1', s.id);
    if (s.user.email.startsWith('s2@')) supMap.set('S2', s.id);
    if (s.user.email.startsWith('s3@')) supMap.set('S3', s.id);
  }

  const s1Id = supMap.get('S1');
  const s2Id = supMap.get('S2');
  const s3Id = supMap.get('S3');

  if (!s1Id || !s2Id || !s3Id) {
    console.warn('Pemasok S1/S2/S3 belum lengkap, melewati seedDemoStocks');
    return;
  }

  // Hitung tanggal D (Senin depan)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Minggu, 1 = Senin, ...
  const daysUntilNextMonday = ((8 - dayOfWeek) % 7) || 7;
  const dDate = new Date(now);
  dDate.setDate(now.getDate() + daysUntilNextMonday);
  dDate.setHours(7, 0, 0, 0);

  // Tanggal panen:
  // S1: D - 1 (kemarinnya D)
  const harvestS1 = new Date(dDate);
  harvestS1.setDate(dDate.getDate() - 1);

  // S2: D (hari yang sama)
  const harvestS2 = new Date(dDate);

  // S3: D - 2 (2 hari sebelum D)
  const harvestS3 = new Date(dDate);
  harvestS3.setDate(dDate.getDate() - 2);

  // 1. Stok S1: 40 kg, Rp 8.000
  const existingS1 = await prisma.supplyOffer.findFirst({
    where: {
      supplierId: s1Id,
      commodityId: bayam.id,
      status: OfferStatus.ACTIVE,
    },
  });
  if (!existingS1) {
    await prisma.supplyOffer.create({
      data: {
        supplierId: s1Id,
        commodityId: bayam.id,
        quantityAvailable: 40,
        quantityReserved: 0,
        askingPrice: 8000,
        harvestDate: harvestS1,
        status: OfferStatus.ACTIVE,
      },
    });
  }

  // 2. Stok S2: 50 kg, Rp 7.500
  const existingS2 = await prisma.supplyOffer.findFirst({
    where: {
      supplierId: s2Id,
      commodityId: bayam.id,
      status: OfferStatus.ACTIVE,
    },
  });
  if (!existingS2) {
    await prisma.supplyOffer.create({
      data: {
        supplierId: s2Id,
        commodityId: bayam.id,
        quantityAvailable: 50,
        quantityReserved: 0,
        askingPrice: 7500,
        harvestDate: harvestS2,
        status: OfferStatus.ACTIVE,
      },
    });
  }

  // 3. Stok S3: 60 kg, Rp 9.000
  const existingS3 = await prisma.supplyOffer.findFirst({
    where: {
      supplierId: s3Id,
      commodityId: bayam.id,
      status: OfferStatus.ACTIVE,
    },
  });
  if (!existingS3) {
    await prisma.supplyOffer.create({
      data: {
        supplierId: s3Id,
        commodityId: bayam.id,
        quantityAvailable: 60,
        quantityReserved: 0,
        askingPrice: 9000,
        harvestDate: harvestS3,
        status: OfferStatus.ACTIVE,
      },
    });
  }

  console.log('✓ Stok Bayam S1 (40 kg), S2 (50 kg), dan S3 (60 kg) aktif dan siap dicocokkan!');
}
