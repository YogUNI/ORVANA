import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanOperationalData() {
  console.log('🧹 Memulai pembersihan data transaksi demo...');

  // 1. Bersihkan tabel transaksional, log, dan riwayat pesanan (reverse order)
  console.log('  -> Menghapus audit log, notifikasi, dan sengketa...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.supplierReview.deleteMany();

  console.log('  -> Menghapus ledger escrow, hasil QC, dan batch pengiriman...');
  await prisma.ledgerEntry.deleteMany();
  await prisma.qualityCheck.deleteMany();
  await prisma.batch.deleteMany();

  console.log('  -> Menghapus pesanan (order) dan armada pengiriman (shipment)...');
  await prisma.order.deleteMany();
  await prisma.shipment.deleteMany();

  console.log('  -> Menghapus penawaran stok & rencana panen petani...');
  await prisma.supplyOffer.deleteMany();
  await prisma.harvestPlan.deleteMany();

  console.log('  -> Menghapus permintaan kebutuhan dapur & jadwal menu...');
  await prisma.demandRequest.deleteMany();
  await prisma.menuPlan.deleteMany();

  console.log('  -> Memperbarui nama wilayah resmi dan akun operasional...');
  // Perbarui nama wilayah jika masih 'Kabupaten Demo'
  await prisma.region.updateMany({
    where: { name: 'Kabupaten Demo' },
    data: { name: 'Kabupaten Bogor' },
  });

  // Perbarui nama tampilan akun admin, pengawas, dan auditor
  await prisma.user.updateMany({
    where: { email: 'admin@orvana.test' },
    data: { name: 'Admin Dinas Ketahanan Pangan' },
  });
  await prisma.user.updateMany({
    where: { email: 'mutu@orvana.test' },
    data: { name: 'Pengawas Mutu Pangan Dinas' },
  });
  await prisma.user.updateMany({
    where: { email: 'auditor@orvana.test' },
    data: { name: 'Auditor Inspektorat Daerah' },
  });

  // Perbarui nama dapur jika masih berbau demo
  await prisma.kitchen.updateMany({
    where: { code: 'DPR01' },
    data: {
      name: 'Dapur Gizi Cibinong',
      address: 'Jl. Raya Tegar Beriman No. 1, Cibinong, Kabupaten Bogor',
    },
  });
  await prisma.kitchen.updateMany({
    where: { code: 'DPR02' },
    data: {
      name: 'Dapur Gizi Ciawi',
      address: 'Jl. Raya Puncak No. 45, Ciawi, Kabupaten Bogor',
    },
  });

  console.log('✅ Semua data transaksi/pesanan demo telah dibersihkan 100%!');
  console.log('💡 Akun login per role (Admin, Dapur, Petani, Koordinator, QC, Auditor) serta Master Data komoditas & resep tetap siap dipakai untuk testing manual Anda.');
}

cleanOperationalData()
  .catch((e) => {
    console.error('❌ Gagal membersihkan data operasional:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
