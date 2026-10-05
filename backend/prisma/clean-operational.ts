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
