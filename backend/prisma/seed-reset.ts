import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAndSeed() {
  console.log('🔄 Memulai Reset Basis Data & Penyemaian Ulang Penuh (npm run seed:reset)...');

  // Bersihkan tabel transaksional dan master (urutan reverse foreign key)
  console.log('🧹 Membersihkan tabel transaksional...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.supplierReview.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.qualityCheck.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.order.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.supplyOffer.deleteMany();
  await prisma.harvestPlan.deleteMany();
  await prisma.demandRequest.deleteMany();
  await prisma.menuPlan.deleteMany();

  console.log('🧹 Membersihkan master data spesifik...');
  await prisma.recipeItem.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.priceReference.deleteMany();
  await prisma.qualityStandard.deleteMany();
  await prisma.commodity.deleteMany();
  await prisma.systemSetting.deleteMany();

  console.log('🧹 Membersihkan profil dan pengguna...');
  await prisma.coordinatorProfile.deleteMany();
  await prisma.supplierProfile.deleteMany();
  await prisma.kitchen.deleteMany();
  await prisma.user.deleteMany();
  await prisma.region.deleteMany();

  console.log('✅ Seluruh tabel telah dibersihkan.');
  await prisma.$disconnect();

  // Jeda 2 detik agar koneksi pooler Neon bersih sebelum seed.ts dibuka kembali
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Jalankan penyemaian
  const { execSync } = await import('child_process');
  execSync('npm run seed:demo', { stdio: 'inherit' });

  console.log('✨ Reset dan penyemaian data berhasil 100%!');
}

resetAndSeed()
  .catch((e) => {
    console.error('❌ Gagal menjalankan reset seed:', e);
    process.exit(1);
  });
