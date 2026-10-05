import { PrismaClient, Role, UserStatus, SupplierType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DEFAULT_SYSTEM_SETTINGS } from '../src/modules/settings/settings.constants';
import {
  COMMODITIES_SEED_DATA,
  DEFAULT_QUALITY_CHECKLIST,
  RECIPES_SEED_DATA,
} from './seed-master.data';

const prisma = new PrismaClient();

export async function main() {
  console.log('🌱 Memulai penyemaian data dasar (T1.6 / docs/09 Bagian 1 - 4)...');

  // 1. Wilayah
  const region = await prisma.region.upsert({
    where: {
      name_province: {
        name: 'Kabupaten Demo',
        province: 'Jawa Barat',
      },
    },
    update: {},
    create: {
      name: 'Kabupaten Demo',
      province: 'Jawa Barat',
    },
  });
  console.log(`✓ Wilayah terdaftar: ${region.name}, ${region.province} (${region.id})`);

  // Kata sandi default akun demo: Demo1234!
  const passwordHash = await bcrypt.hash('Demo1234!', 10);

  // 2. Akun Demo & Profil
  // A. ADMIN
  const admin = await prisma.user.upsert({
    where: { email: 'admin@orvana.test' },
    update: { status: UserStatus.ACTIVE, role: Role.ADMIN, regionId: region.id },
    create: {
      name: 'Admin Dinas Demo',
      email: 'admin@orvana.test',
      passwordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      regionId: region.id,
    },
  });
  console.log(`✓ Akun Admin: ${admin.email}`);

  // B. KITCHEN MANAGERS
  const kitchenManagerA = await prisma.user.upsert({
    where: { email: 'dapur-a@orvana.test' },
    update: { status: UserStatus.ACTIVE, role: Role.KITCHEN_MANAGER, regionId: region.id },
    create: {
      name: 'Pengelola Dapur A',
      email: 'dapur-a@orvana.test',
      passwordHash,
      role: Role.KITCHEN_MANAGER,
      status: UserStatus.ACTIVE,
      regionId: region.id,
    },
  });

  const kitchenManagerB = await prisma.user.upsert({
    where: { email: 'dapur-b@orvana.test' },
    update: { status: UserStatus.ACTIVE, role: Role.KITCHEN_MANAGER, regionId: region.id },
    create: {
      name: 'Pengelola Dapur B',
      email: 'dapur-b@orvana.test',
      passwordHash,
      role: Role.KITCHEN_MANAGER,
      status: UserStatus.ACTIVE,
      regionId: region.id,
    },
  });

  // Dapur A (DPR01) & Dapur B (DPR02)
  const kitchenA = await prisma.kitchen.upsert({
    where: { code: 'DPR01' },
    update: {
      name: 'Dapur Gizi Demo A',
      portionCapacity: 1000,
      latitude: -6.6000,
      longitude: 106.8000,
      managerId: kitchenManagerA.id,
      regionId: region.id,
    },
    create: {
      code: 'DPR01',
      name: 'Dapur Gizi Demo A',
      address: 'Jl. Dapur Sehat No. 1, Kabupaten Demo',
      latitude: -6.6000,
      longitude: 106.8000,
      portionCapacity: 1000,
      managerId: kitchenManagerA.id,
      regionId: region.id,
    },
  });

  const kitchenB = await prisma.kitchen.upsert({
    where: { code: 'DPR02' },
    update: {
      name: 'Dapur Gizi Demo B',
      portionCapacity: 600,
      latitude: -6.6400,
      longitude: 106.8500,
      managerId: kitchenManagerB.id,
      regionId: region.id,
    },
    create: {
      code: 'DPR02',
      name: 'Dapur Gizi Demo B',
      address: 'Jl. Gizi Sejahtera No. 2, Kabupaten Demo',
      latitude: -6.6400,
      longitude: 106.8500,
      portionCapacity: 600,
      managerId: kitchenManagerB.id,
      regionId: region.id,
    },
  });
  console.log(`✓ Dapur terdaftar: ${kitchenA.code} (1000 porsi), ${kitchenB.code} (600 porsi)`);

  // C. SUPPLIERS (S1 s.d. S8)
  const suppliersData = [
    {
      idKey: 's1',
      email: 's1@orvana.test',
      name: 'Tani Makmur (S1)',
      displayName: 'Tani Makmur',
      type: SupplierType.FARMER,
      village: 'Sukamaju',
      lat: -6.5460,
      lng: 106.8000,
      qualityScore: 88,
      reliabilityRate: 0.95,
      totalOrders: 10,
      publicName: true,
    },
    {
      idKey: 's2',
      email: 's2@orvana.test',
      name: 'Kelompok Tani Sari (S2)',
      displayName: 'Kelompok Tani Sari',
      type: SupplierType.FARMER,
      village: 'Mekarsari',
      lat: -6.5370,
      lng: 106.9098,
      qualityScore: 80,
      reliabilityRate: 0.80,
      totalOrders: 8,
      publicName: false,
    },
    {
      idKey: 's3',
      email: 's3@orvana.test',
      name: 'Tani Jaya (S3)',
      displayName: 'Tani Jaya',
      type: SupplierType.FARMER,
      village: 'Jayagiri',
      lat: -6.4561,
      lng: 106.5491,
      qualityScore: 92,
      reliabilityRate: 0.90,
      totalOrders: 12,
      publicName: false,
    },
    {
      idKey: 's4',
      email: 's4@orvana.test',
      name: 'Gapoktan Harapan (S4)',
      displayName: 'Gapoktan Harapan',
      type: SupplierType.FARMER,
      village: 'Harapan',
      lat: -6.6935,
      lng: 106.8543,
      qualityScore: 85,
      reliabilityRate: 0.90,
      totalOrders: 9,
      publicName: true,
    },
    {
      idKey: 's5',
      email: 's5@orvana.test',
      name: 'Mina Lestari (S5)',
      displayName: 'Mina Lestari',
      type: SupplierType.FISHER,
      village: 'Cibening',
      lat: -6.6000,
      lng: 106.9811,
      qualityScore: 84,
      reliabilityRate: 0.88,
      totalOrders: 7,
      publicName: false,
    },
    {
      idKey: 's6',
      email: 's6@orvana.test',
      name: 'Peternak Ayam Berkah (S6)',
      displayName: 'Peternak Ayam Berkah',
      type: SupplierType.LIVESTOCK,
      village: 'Karangsari',
      lat: -6.8113,
      lng: 106.7226,
      qualityScore: 78,
      reliabilityRate: 0.85,
      totalOrders: 6,
      publicName: false,
    },
    {
      idKey: 's7',
      email: 's7@orvana.test',
      name: 'UMKM Tempe Bu Rina (S7)',
      displayName: 'UMKM Tempe Bu Rina',
      type: SupplierType.PROCESSOR,
      village: 'Pasirmulya',
      lat: -6.6450,
      lng: 106.7216,
      qualityScore: 90,
      reliabilityRate: 0.92,
      totalOrders: 6,
      publicName: true,
    },
    {
      idKey: 's8',
      email: 's8@orvana.test',
      name: 'Kelompok Tani Subur (S8)',
      displayName: 'Kelompok Tani Subur',
      type: SupplierType.FARMER,
      village: 'Subur',
      lat: -6.4598,
      lng: 106.7185,
      qualityScore: 82,
      reliabilityRate: 0.85,
      totalOrders: 5,
      publicName: false,
    },
  ];

  for (const s of suppliersData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { status: UserStatus.ACTIVE, role: Role.SUPPLIER, regionId: region.id },
      create: {
        name: s.name,
        email: s.email,
        passwordHash,
        role: Role.SUPPLIER,
        status: UserStatus.ACTIVE,
        regionId: region.id,
      },
    });

    await prisma.supplierProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName: s.displayName,
        type: s.type,
        village: s.village,
        latitude: s.lat,
        longitude: s.lng,
        qualityScore: s.qualityScore,
        reliabilityRate: s.reliabilityRate,
        totalOrders: s.totalOrders,
        publicName: s.publicName,
        regionId: region.id,
      },
      create: {
        userId: user.id,
        displayName: s.displayName,
        type: s.type,
        address: `Desa ${s.village}, Kabupaten Demo`,
        village: s.village,
        latitude: s.lat,
        longitude: s.lng,
        qualityScore: s.qualityScore,
        reliabilityRate: s.reliabilityRate,
        totalOrders: s.totalOrders,
        publicName: s.publicName,
        regionId: region.id,
      },
    });
  }
  console.log(`✓ 8 Pemasok terdaftar (S1 s.d. S8)`);

  // D. COORDINATORS
  const coordinatorsData = [
    {
      email: 'koordinator1@orvana.test',
      name: 'Koperasi Lumbung Desa',
      orgName: 'Koperasi Lumbung Desa',
      pointName: 'Titik Kumpul Sukamaju',
      lat: -6.5700,
      lng: 106.8100,
    },
    {
      email: 'koordinator2@orvana.test',
      name: 'Pengepul Bersama',
      orgName: 'Pengepul Bersama',
      pointName: 'Titik Kumpul Mekarsari',
      lat: -6.5500,
      lng: 106.8900,
    },
  ];

  for (const c of coordinatorsData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { status: UserStatus.ACTIVE, role: Role.COORDINATOR, regionId: region.id },
      create: {
        name: c.name,
        email: c.email,
        passwordHash,
        role: Role.COORDINATOR,
        status: UserStatus.ACTIVE,
        regionId: region.id,
      },
    });

    await prisma.coordinatorProfile.upsert({
      where: { userId: user.id },
      update: {
        organizationName: c.orgName,
        collectionPointName: c.pointName,
        latitude: c.lat,
        longitude: c.lng,
        regionId: region.id,
      },
      create: {
        userId: user.id,
        organizationName: c.orgName,
        collectionPointName: c.pointName,
        address: `Titik Kumpul ${c.pointName}, Kabupaten Demo`,
        latitude: c.lat,
        longitude: c.lng,
        regionId: region.id,
      },
    });
  }
  console.log(`✓ 2 Koordinator terdaftar`);

  // E. QUALITY INSPECTOR
  const inspector = await prisma.user.upsert({
    where: { email: 'mutu@orvana.test' },
    update: { status: UserStatus.ACTIVE, role: Role.QUALITY_INSPECTOR, regionId: region.id },
    create: {
      name: 'Pengawas Mutu Demo',
      email: 'mutu@orvana.test',
      passwordHash,
      role: Role.QUALITY_INSPECTOR,
      status: UserStatus.ACTIVE,
      regionId: region.id,
    },
  });
  console.log(`✓ Pengawas Mutu: ${inspector.email}`);

  // F. AUDITOR
  const auditor = await prisma.user.upsert({
    where: { email: 'auditor@orvana.test' },
    update: { status: UserStatus.ACTIVE, role: Role.AUDITOR, regionId: region.id },
    create: {
      name: 'Auditor Publik Demo',
      email: 'auditor@orvana.test',
      passwordHash,
      role: Role.AUDITOR,
      status: UserStatus.ACTIVE,
      regionId: region.id,
    },
  });
  console.log(`✓ Auditor Publik: ${auditor.email}`);

  // 3. Konfigurasi Sistem Default (SystemSetting)
  for (const [key, value] of Object.entries(DEFAULT_SYSTEM_SETTINGS)) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log(`✓ 15 Konfigurasi Sistem Default tersimpan`);

  // 4. Komoditas, Standar Mutu, & Harga Acuan (T2.2 / docs/09 Bagian 5.1)
  console.log('🌾 Menyemai data master komoditas, standar mutu, & harga acuan...');
  const validFromYearStart = new Date(new Date().getFullYear(), 0, 1);
  const commodityMap = new Map<string, string>();

  for (const item of COMMODITIES_SEED_DATA) {
    const commodity = await prisma.commodity.upsert({
      where: { name: item.name },
      update: {
        category: item.category,
        unit: item.unit,
        shelfLifeDays: item.shelfLifeDays,
        wastePercent: item.wastePercent,
        isActive: true,
      },
      create: {
        name: item.name,
        category: item.category,
        unit: item.unit,
        shelfLifeDays: item.shelfLifeDays,
        wastePercent: item.wastePercent,
        isActive: true,
      },
    });

    commodityMap.set(item.name, commodity.id);

    // Standar Mutu (passScore 70, bobot checklist 100)
    await prisma.qualityStandard.upsert({
      where: { commodityId: commodity.id },
      update: {
        passScore: 70,
        checklist: DEFAULT_QUALITY_CHECKLIST,
      },
      create: {
        commodityId: commodity.id,
        passScore: 70,
        checklist: DEFAULT_QUALITY_CHECKLIST,
      },
    });

    // Harga Acuan (wilayah Kabupaten Demo, diset oleh Admin)
    const existingPriceRef = await prisma.priceReference.findFirst({
      where: {
        commodityId: commodity.id,
        regionId: region.id,
        validTo: null,
      },
    });

    if (existingPriceRef) {
      await prisma.priceReference.update({
        where: { id: existingPriceRef.id },
        data: {
          referencePrice: item.referencePrice,
          floorPrice: item.floorPrice,
          ceilingPrice: item.ceilingPrice,
          validFrom: validFromYearStart,
          setById: admin.id,
        },
      });
    } else {
      await prisma.priceReference.create({
        data: {
          commodityId: commodity.id,
          regionId: region.id,
          referencePrice: item.referencePrice,
          floorPrice: item.floorPrice,
          ceilingPrice: item.ceilingPrice,
          validFrom: validFromYearStart,
          validTo: null,
          setById: admin.id,
        },
      });
    }
  }
  console.log(`✓ 13 Komoditas, Standar Mutu, dan Harga Acuan terdaftar`);

  // 5. Resep Baku (R1 s.d. R5) (T2.2 / docs/09 Bagian 5.2)
  console.log('🍳 Menyemai data resep baku (R1 s.d. R5)...');
  for (const r of RECIPES_SEED_DATA) {
    const recipe = await prisma.recipe.upsert({
      where: { name: r.name },
      update: {
        description: r.description,
      },
      create: {
        name: r.name,
        description: r.description,
      },
    });

    for (const ri of r.items) {
      const commodityId = commodityMap.get(ri.commodityName);
      if (!commodityId) {
        throw new Error(`Komoditas ${ri.commodityName} tidak ditemukan untuk resep ${r.name}`);
      }

      await prisma.recipeItem.upsert({
        where: {
          recipeId_commodityId: {
            recipeId: recipe.id,
            commodityId,
          },
        },
        update: {
          quantityPerPortion: ri.quantityPerPortion,
        },
        create: {
          recipeId: recipe.id,
          commodityId,
          quantityPerPortion: ri.quantityPerPortion,
        },
      });
    }
  }
  console.log(`✓ 5 Resep Baku (R1 s.d. R5) beserta item bahan tersimpan`);

  // 6. Data Historis Demo (docs/09 bagian 7)
  const { seedHistoricalOrders } = await import('./seed-history');
  await seedHistoricalOrders(prisma);

  // 7. Stok Pemasok untuk Skenario Demo Langsung (docs/09 bagian 6 & docs/11 bagian 4)
  const { seedDemoStocks } = await import('./seed-stocks');
  await seedDemoStocks(prisma);

  console.log('🎉 Seluruh data dasar, master data, dan riwayat demo berhasil disemai!');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Terjadi kesalahan saat penyemaian data:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
