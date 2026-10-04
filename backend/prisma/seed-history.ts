import { PrismaClient, OrderStatus, ShipmentStatus, QcResult, LedgerStage } from '@prisma/client';

export async function seedHistoricalOrders(prisma: PrismaClient) {
  console.log('📜 Menyemai 6 order historis untuk pengujian dashboard demo (docs/09 bagian 7)...');

  // Ambil Dapur A
  const kitchenA = await prisma.kitchen.findUnique({
    where: { code: 'DPR01' },
    include: { manager: true },
  });
  if (!kitchenA) throw new Error('Kitchen DPR01 belum ada saat seed history');

  // Ambil Koordinator
  const coordinator = await prisma.coordinatorProfile.findFirst({
    include: { user: true },
  });
  if (!coordinator) throw new Error('Coordinator belum ada saat seed history');

  // Ambil Inspector
  const inspector = await prisma.user.findFirst({
    where: { role: 'QUALITY_INSPECTOR' },
  });
  if (!inspector) throw new Error('Inspector belum ada saat seed history');

  // Ambil profil supplier S1, S2, S5, S6, S7, S8
  const suppliers = await prisma.supplierProfile.findMany({
    include: { user: true },
  });

  const supMap = new Map<string, string>();
  for (const s of suppliers) {
    if (s.user.email.startsWith('s1@')) supMap.set('S1', s.id);
    if (s.user.email.startsWith('s2@')) supMap.set('S2', s.id);
    if (s.user.email.startsWith('s5@')) supMap.set('S5', s.id);
    if (s.user.email.startsWith('s6@')) supMap.set('S6', s.id);
    if (s.user.email.startsWith('s7@')) supMap.set('S7', s.id);
    if (s.user.email.startsWith('s8@')) supMap.set('S8', s.id);
  }

  // Ambil komoditas
  const commodities = await prisma.commodity.findMany();
  const comMap = new Map<string, string>();
  for (const c of commodities) {
    comMap.set(c.name.toLowerCase(), c.id);
  }

  // 6 Order Historis (H1 s.d. H6):
  // 14 hari yang lalu
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const historySpecs = [
    {
      code: 'H1',
      orderNo: 'ORD-HIST-0001',
      batchCode: 'ORV-20260920-DPR01-0001',
      supCode: 'S1',
      commodityName: 'bayam',
      qty: 50,
      price: 8000,
      accepted: 50,
      rejected: 0,
      result: QcResult.PASS,
      release: 400000,
      void: 0,
      onTime: true,
      score: 90,
    },
    {
      code: 'H2',
      orderNo: 'ORD-HIST-0002',
      batchCode: 'ORV-20260920-DPR01-0002',
      supCode: 'S5',
      commodityName: 'ikan lele',
      qty: 70,
      price: 31000,
      accepted: 70,
      rejected: 0,
      result: QcResult.PASS,
      release: 2170000,
      void: 0,
      onTime: true,
      score: 88,
    },
    {
      code: 'H3',
      orderNo: 'ORD-HIST-0003',
      batchCode: 'ORV-20260920-DPR01-0003',
      supCode: 'S6',
      commodityName: 'telur ayam',
      qty: 60,
      price: 28000,
      accepted: 55,
      rejected: 5,
      result: QcResult.PARTIAL,
      release: 1540000,
      void: 140000,
      onTime: false,
      score: 75,
    },
    {
      code: 'H4',
      orderNo: 'ORD-HIST-0004',
      batchCode: 'ORV-20260920-DPR01-0004',
      supCode: 'S2',
      commodityName: 'wortel',
      qty: 40,
      price: 12500,
      accepted: 40,
      rejected: 0,
      result: QcResult.PASS,
      release: 500000,
      void: 0,
      onTime: true,
      score: 86,
    },
    {
      code: 'H5',
      orderNo: 'ORD-HIST-0005',
      batchCode: 'ORV-20260920-DPR01-0005',
      supCode: 'S7',
      commodityName: 'tempe',
      qty: 50,
      price: 22000,
      accepted: 0,
      rejected: 50,
      result: QcResult.FAIL,
      release: 0,
      void: 1100000,
      onTime: true,
      score: 45,
    },
    {
      code: 'H6',
      orderNo: 'ORD-HIST-0006',
      batchCode: 'ORV-20260920-DPR01-0006',
      supCode: 'S8',
      commodityName: 'beras',
      qty: 80,
      price: 14000,
      accepted: 80,
      rejected: 0,
      result: QcResult.PASS,
      release: 1120000,
      void: 0,
      onTime: true,
      score: 92,
    },
  ];

  for (const item of historySpecs) {
    const supId = supMap.get(item.supCode);
    const comId = comMap.get(item.commodityName);
    if (!supId || !comId) {
      console.warn(`Pemasok ${item.supCode} atau komoditas ${item.commodityName} tidak ditemukan.`);
      continue;
    }

    // 1. Demand Request
    const demand = await prisma.demandRequest.upsert({
      where: { id: `dem-hist-${item.code}` },
      update: {},
      create: {
        id: `dem-hist-${item.code}`,
        kitchenId: kitchenA.id,
        commodityId: comId,
        quantity: item.qty,
        neededDate: twoWeeksAgo,
        maxPricePerUnit: item.price + 2000,
        status: 'FULFILLED',
      },
    });

    // 2. Supply Offer
    const offer = await prisma.supplyOffer.upsert({
      where: { id: `off-hist-${item.code}` },
      update: {},
      create: {
        id: `off-hist-${item.code}`,
        supplierId: supId,
        commodityId: comId,
        quantityAvailable: item.qty,
        askingPrice: item.price,
        harvestDate: twoWeeksAgo,
        status: 'DEPLETED',
      },
    });

    // 3. Shipment
    const shipment = await prisma.shipment.upsert({
      where: { shipmentNo: `SHP-HIST-${item.code}` },
      update: {},
      create: {
        shipmentNo: `SHP-HIST-${item.code}`,
        coordinatorId: coordinator.id,
        kitchenId: kitchenA.id,
        scheduledAt: twoWeeksAgo,
        departedAt: twoWeeksAgo,
        arrivedAt: item.onTime ? twoWeeksAgo : new Date(twoWeeksAgo.getTime() + 86400000), // telat 1 hari jika false
        status: ShipmentStatus.ARRIVED,
        transportCost: 50000,
      },
    });

    // 4. Order
    const order = await prisma.order.upsert({
      where: { orderNo: item.orderNo },
      update: {},
      create: {
        orderNo: item.orderNo,
        demandId: demand.id,
        offerId: offer.id,
        supplierId: supId,
        kitchenId: kitchenA.id,
        commodityId: comId,
        quantity: item.qty,
        pricePerUnit: item.price,
        matchScore: 90,
        status: OrderStatus.COMPLETED,
        offerExpiresAt: new Date(twoWeeksAgo.getTime() + 3600000 * 12),
        respondedAt: twoWeeksAgo,
        shipmentId: shipment.id,
        createdAt: twoWeeksAgo,
      },
    });

    // 5. Batch
    const batch = await prisma.batch.upsert({
      where: { batchCode: item.batchCode },
      update: {},
      create: {
        batchCode: item.batchCode,
        orderId: order.id,
        originVillage: 'Desa Binaan',
        harvestDate: twoWeeksAgo,
        shippedQuantity: item.qty,
        receivedQuantity: item.qty,
        receivedAt: twoWeeksAgo,
        createdAt: twoWeeksAgo,
      },
    });

    // 6. QualityCheck
    const existingQc = await prisma.qualityCheck.findFirst({
      where: { batchId: batch.id },
    });
    if (!existingQc) {
      await prisma.qualityCheck.create({
        data: {
          batchId: batch.id,
          inspectorId: inspector.id,
          score: item.score,
          checklistScores: {
            freshness: item.score,
            cleanliness: item.score,
            moisture: item.score,
          },
          receivedQuantity: item.qty,
          acceptedQuantity: item.accepted,
          rejectedQuantity: item.rejected,
          result: item.result,
          notes: item.rejected > 0 ? 'Sebagian sortiran rusak / tidak sesuai standar mutu' : 'Kualitas sangat prima',
          checkedAt: twoWeeksAgo,
        },
      });
    }

    // 7. Ledger Entries (HOLD, RELEASE, VOID)
    const holdCount = await prisma.ledgerEntry.count({
      where: { orderId: order.id, stage: LedgerStage.HOLD },
    });
    if (holdCount === 0) {
      await prisma.ledgerEntry.create({
        data: {
          orderId: order.id,
          stage: LedgerStage.HOLD,
          amount: item.qty * item.price,
          note: 'Pencadangan awal order disanggupi',
          createdAt: twoWeeksAgo,
        },
      });
    }

    if (item.release > 0) {
      const relCount = await prisma.ledgerEntry.count({
        where: { orderId: order.id, stage: LedgerStage.RELEASE },
      });
      if (relCount === 0) {
        await prisma.ledgerEntry.create({
          data: {
            orderId: order.id,
            stage: LedgerStage.RELEASE,
            amount: item.release,
            note: 'Pencairan pembayaran hasil QC',
            createdAt: twoWeeksAgo,
          },
        });
      }
    }

    if (item.void > 0) {
      const voidCount = await prisma.ledgerEntry.count({
        where: { orderId: order.id, stage: LedgerStage.VOID },
      });
      if (voidCount === 0) {
        await prisma.ledgerEntry.create({
          data: {
            orderId: order.id,
            stage: LedgerStage.VOID,
            amount: item.void,
            note: 'Pembatalan dana akibat penolakan mutu',
            createdAt: twoWeeksAgo,
          },
        });
      }
    }
  }

  console.log('✓ 6 Order Historis (H1 s.d. H6) berhasil disemai ke basis data!');
}
