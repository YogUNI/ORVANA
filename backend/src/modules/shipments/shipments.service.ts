import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  OrderStatus,
  ShipmentStatus,
  Role,
} from '@prisma/client';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { scopeWhere } from '../../common/utils/scope-where.util';
import { CreateShipmentDto, UpdateShipmentStatusDto } from './dto/shipment.dto';

// Siklus status transisi pengiriman resmi docs/03
export const VALID_SHIPMENT_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  [ShipmentStatus.PLANNED]: [
    ShipmentStatus.PICKING_UP,
    ShipmentStatus.CANCELLED,
  ],
  [ShipmentStatus.PICKING_UP]: [
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.CANCELLED,
  ],
  [ShipmentStatus.IN_TRANSIT]: [
    ShipmentStatus.ARRIVED,
  ],
  [ShipmentStatus.ARRIVED]: [],
  [ShipmentStatus.CANCELLED]: [],
};

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * Mengambil daftar pesanan ACCEPTED yang siap dikonsolidasikan ke pengiriman
   * Endpoint: GET /orders/available-for-shipment (docs/06 M5)
   */
  async getAvailableOrdersForShipment(user: JwtPayload) {
    if (user.role !== Role.COORDINATOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Hanya koordinator wilayah atau admin yang dapat mengakses daftar pesanan siap kirim',
      });
    }

    let coordinatorProfile: any = null;
    if (user.role === Role.COORDINATOR) {
      coordinatorProfile = await this.prisma.coordinatorProfile.findUnique({
        where: { userId: user.sub },
      });
      if (!coordinatorProfile) {
        throw new ForbiddenException({
          code: 'PROFILE_NOT_FOUND',
          message: 'Profil koordinator tidak ditemukan',
        });
      }
    }

    const regionFilter = coordinatorProfile
      ? { kitchen: { regionId: coordinatorProfile.regionId } }
      : user.regionId
      ? { kitchen: { regionId: user.regionId } }
      : {};

    const availableOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.ACCEPTED,
        shipmentId: null, // Belum tergabung dalam pengiriman
        ...regionFilter,
      },
      include: {
        commodity: true,
        kitchen: true,
        demand: true,
        supplier: {
          include: {
            user: {
              select: { name: true, phone: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Kelompokkan per dapur dan tanggal kebutuhan (docs/06 M5)
    const groupedMap = new Map<string, {
      kitchenId: string;
      kitchenName: string;
      kitchenCode: string;
      neededDate: string;
      totalOrders: number;
      totalQuantityKg: number;
      orders: any[];
    }>();

    for (const ord of availableOrders) {
      const neededDateStr = ord.demand.neededDate.toISOString().split('T')[0];
      const groupKey = `${ord.kitchenId}_${neededDateStr}`;

      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, {
          kitchenId: ord.kitchenId,
          kitchenName: ord.kitchen.name,
          kitchenCode: ord.kitchen.code,
          neededDate: neededDateStr,
          totalOrders: 0,
          totalQuantityKg: 0,
          orders: [],
        });
      }

      const grp = groupedMap.get(groupKey)!;
      grp.totalOrders += 1;
      grp.totalQuantityKg += Number(ord.quantity);
      grp.orders.push({
        id: ord.id,
        orderNo: ord.orderNo,
        commodityId: ord.commodityId,
        commodityName: ord.commodity.name,
        quantity: Number(ord.quantity),
        pricePerUnit: Number(ord.pricePerUnit),
        totalPrice: Math.round(Number(ord.quantity) * Number(ord.pricePerUnit)),
        supplierId: ord.supplierId,
        supplierName: ord.supplier.displayName,
        village: ord.supplier.village,
        latitude: ord.supplier.latitude,
        longitude: ord.supplier.longitude,
      });
    }

    return Array.from(groupedMap.values());
  }

  /**
   * Membuat rencana pengiriman baru (konsolidasi)
   * Endpoint: POST /shipments
   */
  async createShipment(dto: CreateShipmentDto, user: JwtPayload, ipAddress?: string) {
    if (user.role !== Role.COORDINATOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Hanya koordinator wilayah atau admin yang dapat membuat pengiriman',
      });
    }

    let coordinatorId: string;
    if (user.role === Role.COORDINATOR) {
      const profile = await this.prisma.coordinatorProfile.findUnique({
        where: { userId: user.sub },
      });
      if (!profile) {
        throw new ForbiddenException({
          code: 'PROFILE_NOT_FOUND',
          message: 'Profil koordinator tidak ditemukan',
        });
      }
      coordinatorId = profile.id;
    } else {
      // Jika ADMIN membuat pengiriman, gunakan koordinator pertama pada wilayah dapur tersebut
      const kitchen = await this.prisma.kitchen.findUnique({
        where: { id: dto.kitchenId },
      });
      const coord = await this.prisma.coordinatorProfile.findFirst({
        where: { regionId: kitchen?.regionId },
      });
      if (!coord) {
        throw new BadRequestException({
          code: 'NO_COORDINATOR_IN_REGION',
          message: 'Tidak ada koordinator aktif di wilayah dapur ini',
        });
      }
      coordinatorId = coord.id;
    }

    // 1. Ambil seluruh order yang dipilih
    const orders = await this.prisma.order.findMany({
      where: {
        id: { in: dto.orderIds },
      },
      include: {
        kitchen: true,
      },
    });

    if (orders.length !== dto.orderIds.length) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Sebagian pesanan yang dipilih tidak ditemukan',
      });
    }

    // 2. Kriteria Penerimaan: Validasi Satu Dapur Tujuan (docs/06 M5)
    for (const ord of orders) {
      if (ord.kitchenId !== dto.kitchenId) {
        throw new UnprocessableEntityException({
          code: 'MULTIPLE_KITCHENS_NOT_ALLOWED',
          message: 'Seluruh pesanan dalam satu pengiriman harus ditujukan untuk dapur gizi yang sama',
        });
      }
    }

    // 3. Kriteria Penerimaan: Periksa order belum dikonsolidasikan (docs/06 M5)
    for (const ord of orders) {
      if (ord.status !== OrderStatus.ACCEPTED || ord.shipmentId !== null) {
        throw new ConflictException({
          code: 'ORDER_ALREADY_CONSOLIDATED',
          message: `Pesanan ${ord.orderNo} sudah dikonsolidasikan atau belum disanggupi pemasok`,
        });
      }
    }

    // 4. Generate Nomor Pengiriman Unik (Format: SHP-YYYYMMDD-seq3) docs/04 bagian 11
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = await this.prisma.shipment.count({
      where: {
        shipmentNo: {
          startsWith: `SHP-${dateStr}`,
        },
      },
    });
    const seq3 = String(countToday + 1).padStart(3, '0');
    const shipmentNo = `SHP-${dateStr}-${seq3}`;

    // 5. Transaksi Atomik: Buat Shipment dan ubah status order menjadi CONSOLIDATED
    const createdShipment = await this.prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          shipmentNo,
          coordinatorId,
          kitchenId: dto.kitchenId,
          scheduledAt: new Date(dto.scheduledAt),
          transportCost: dto.transportCost || 0,
          routeNotes: dto.routeNotes || null,
          status: ShipmentStatus.PLANNED,
        },
      });

      // Update seluruh order yang terikat
      await tx.order.updateMany({
        where: {
          id: { in: dto.orderIds },
        },
        data: {
          shipmentId: shipment.id,
          status: OrderStatus.CONSOLIDATED,
        },
      });

      return shipment;
    });

    await this.auditService.log({
      action: 'SHIPMENT_CREATED',
      entity: 'Shipment',
      entityId: createdShipment.id,
      userId: user.sub,
      ipAddress,
      meta: {
        shipmentNo,
        kitchenId: dto.kitchenId,
        orderCount: orders.length,
        orderIds: dto.orderIds,
      },
    });

    return {
      message: 'Rencana pengiriman berhasil dibuat dan pesanan berhasil dikonsolidasikan',
      shipment: createdShipment,
    };
  }

  /**
   * Mengambil daftar seluruh pengiriman dengan scoping peran
   */
  async findAll(user: JwtPayload, query: { status?: ShipmentStatus; kitchenId?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    let profileIds: any = {};
    if (user.role === Role.COORDINATOR) {
      const coord = await this.prisma.coordinatorProfile.findUnique({
        where: { userId: user.sub },
      });
      profileIds.coordinatorProfileId = coord?.id;
    }

    const baseWhere = scopeWhere(user, 'shipment', profileIds);
    const where: any = {
      ...baseWhere,
    };

    if (query.status) {
      where.status = query.status;
    }
    if (query.kitchenId && user.role === Role.ADMIN) {
      where.kitchenId = query.kitchenId;
    }

    const [total, shipments] = await Promise.all([
      this.prisma.shipment.count({ where }),
      this.prisma.shipment.findMany({
        where,
        include: {
          kitchen: true,
          coordinator: {
            include: { user: { select: { name: true, phone: true } } },
          },
          orders: {
            include: {
              commodity: true,
              supplier: true,
              batch: true,
            },
          },
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formatted = shipments.map((s) => ({
      ...s,
      transportCost: Number(s.transportCost),
      lossKg: Number(s.lossKg),
      totalQuantityKg: s.orders.reduce((sum, o) => sum + Number(o.quantity), 0),
      orders: s.orders.map((o) => ({
        ...o,
        quantity: Number(o.quantity),
        pricePerUnit: Number(o.pricePerUnit),
        matchScore: Number(o.matchScore),
        totalPrice: Math.round(Number(o.quantity) * Number(o.pricePerUnit)),
      })),
    }));

    return {
      data: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mengambil detail satu pengiriman beserta rute jemput pemasok
   */
  async findById(id: string, user: JwtPayload) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        kitchen: true,
        coordinator: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
        orders: {
          include: {
            commodity: true,
            demand: true,
            offer: true,
            supplier: {
              include: {
                user: { select: { name: true, phone: true } },
              },
            },
            batch: true,
          },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException({
        code: 'SHIPMENT_NOT_FOUND',
        message: 'Pengiriman tidak ditemukan',
      });
    }

    // Scoping akses
    if (user.role === Role.COORDINATOR) {
      const coord = await this.prisma.coordinatorProfile.findUnique({
        where: { userId: user.sub },
      });
      if (shipment.coordinatorId !== coord?.id) {
        throw new ForbiddenException({
          code: 'FORBIDDEN_RESOURCE',
          message: 'Anda tidak memiliki hak akses ke pengiriman koordinator lain',
        });
      }
    } else if (user.role === Role.KITCHEN_MANAGER && shipment.kitchen.managerId !== user.sub) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Anda tidak memiliki hak akses ke pengiriman dapur lain',
      });
    }

    return {
      ...shipment,
      transportCost: Number(shipment.transportCost),
      lossKg: Number(shipment.lossKg),
      totalQuantityKg: shipment.orders.reduce((sum, o) => sum + Number(o.quantity), 0),
      orders: shipment.orders.map((o) => ({
        ...o,
        quantity: Number(o.quantity),
        pricePerUnit: Number(o.pricePerUnit),
        matchScore: Number(o.matchScore),
        totalPrice: Math.round(Number(o.quantity) * Number(o.pricePerUnit)),
      })),
    };
  }

  /**
   * Mengubah status pengiriman dan memicu pembuatan Batch / pembaruan keandalan
   * Endpoint: PATCH /shipments/:id/status
   */
  async updateStatus(
    id: string,
    dto: UpdateShipmentStatusDto,
    user: JwtPayload,
    ipAddress?: string,
  ) {
    if (user.role !== Role.COORDINATOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Hanya koordinator wilayah atau admin yang dapat memperbarui status pengiriman',
      });
    }

    const targetStatus = dto.status as ShipmentStatus;

    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findUnique({
        where: { id },
        include: {
          kitchen: true,
          orders: {
            include: {
              demand: true,
              offer: true,
              supplier: true,
              batch: true,
            },
          },
        },
      });

      if (!shipment) {
        throw new NotFoundException({
          code: 'SHIPMENT_NOT_FOUND',
          message: 'Pengiriman tidak ditemukan',
        });
      }

      // Validasi transisi status resmi (docs/06 M5: loncat status ditolak INVALID_TRANSITION)
      const allowedTransitions = VALID_SHIPMENT_TRANSITIONS[shipment.status] || [];
      if (!allowedTransitions.includes(targetStatus)) {
        throw new BadRequestException({
          code: 'INVALID_TRANSITION',
          message: `Transisi status pengiriman dari ${shipment.status} ke ${targetStatus} tidak diizinkan`,
        });
      }

      const now = new Date();
      const updateData: any = { status: targetStatus };

      // Logika Transisi Khusus:
      if (targetStatus === ShipmentStatus.IN_TRANSIT) {
        // Armada Berangkat: Set departedAt dan terbitkan Batch unik untuk setiap order
        updateData.departedAt = now;

        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const kitchenCode = shipment.kitchen.code;

        for (let i = 0; i < shipment.orders.length; i++) {
          const ord = shipment.orders[i];

          // Buat Batch jika belum ada (idempoten)
          if (!ord.batch) {
            // Hitung urutan batch harian per dapur (docs/04 bagian 11: ORV-{YYYYMMDD}-{kitchen.code}-{seq4})
            const countBatchToday = await tx.batch.count({
              where: {
                batchCode: {
                  startsWith: `ORV-${dateStr}-${kitchenCode}`,
                },
              },
            });
            const seq4 = String(countBatchToday + 1).padStart(4, '0');
            const batchCode = `ORV-${dateStr}-${kitchenCode}-${seq4}`;

            await tx.batch.create({
              data: {
                batchCode,
                orderId: ord.id,
                originVillage: ord.supplier.village || null,
                harvestDate: ord.offer.harvestDate,
                shippedQuantity: ord.quantity,
              },
            });
          }

          // Ubah status order menjadi IN_TRANSIT
          await tx.order.update({
            where: { id: ord.id },
            data: { status: OrderStatus.IN_TRANSIT },
          });
        }
      } else if (targetStatus === ShipmentStatus.ARRIVED) {
        // Armada Tiba di Dapur
        updateData.arrivedAt = now;
        updateData.lossKg = dto.lossKg || 0;
        updateData.lossReason = dto.lossReason || null;

        // Ambil konfigurasi supplier.reliabilityEmaAlpha (docs/04 bagian 6.4)
        const alpha = await this.settingsService.getSetting<number>(
          'supplier.reliabilityEmaAlpha',
          0.2,
        );

        for (const ord of shipment.orders) {
          // Evaluasi onTime: arrivedAt <= akhir hari neededDate Asia/Jakarta (+7)
          const neededDate = new Date(ord.demand.neededDate);
          // Akhir hari neededDate: 23:59:59.999 WIB
          const endOfNeededDay = new Date(neededDate);
          endOfNeededDay.setUTCHours(16, 59, 59, 999); // 23:59:59.999 WIB = 16:59:59.999 UTC

          const onTime = now.getTime() <= endOfNeededDay.getTime() ? 1.0 : 0.0;

          // Hitung nilai keandalan baru: (1 - alpha) * old + alpha * onTime
          const oldReliability = Number(ord.supplier.reliabilityRate);
          const newReliability = Number(
            ((1 - alpha) * oldReliability + alpha * onTime).toFixed(4),
          );

          // Update profil supplier
          await tx.supplierProfile.update({
            where: { id: ord.supplierId },
            data: {
              reliabilityRate: newReliability,
              totalOrders: { increment: 1 },
            },
          });
        }
      } else if (targetStatus === ShipmentStatus.CANCELLED) {
        // Pembatalan pengiriman: kembalikan order ke ACCEPTED dan putus shipmentId
        await tx.order.updateMany({
          where: { shipmentId: shipment.id },
          data: {
            shipmentId: null,
            status: OrderStatus.ACCEPTED,
          },
        });
      }

      const updatedShipment = await tx.shipment.update({
        where: { id: shipment.id },
        data: updateData,
        include: {
          orders: {
            include: { batch: true },
          },
        },
      });

      await this.auditService.log({
        action: 'SHIPMENT_STATUS_CHANGED',
        entity: 'Shipment',
        entityId: shipment.id,
        userId: user.sub,
        ipAddress,
        meta: {
          shipmentNo: shipment.shipmentNo,
          previousStatus: shipment.status,
          newStatus: targetStatus,
          lossKg: dto.lossKg,
        },
      });

      // Kirim notifikasi lintas peran (docs/03 Bagian 4 & 6)
      if (this.notificationsService) {
        if (targetStatus === ShipmentStatus.IN_TRANSIT && shipment.kitchen?.managerId) {
          // Beri tahu pengelola dapur bahwa armada telah berangkat
          await this.notificationsService.createNotification(
            {
              userId: shipment.kitchen.managerId,
              type: 'SHIPMENT_IN_TRANSIT',
              title: 'Armada Pengiriman Sedang Menuju Dapur',
              body: `Pengiriman ${shipment.shipmentNo} telah berangkat dengan membawa ${shipment.orders.length} pesanan bahan pangan. Kode batch telah diterbitkan.`,
              link: '/kitchen/receiving',
            },
            tx,
          );
        } else if (targetStatus === ShipmentStatus.ARRIVED) {
          // Beri tahu pengelola dapur untuk catat serah terima
          if (shipment.kitchen?.managerId) {
            await this.notificationsService.createNotification(
              {
                userId: shipment.kitchen.managerId,
                type: 'SHIPMENT_ARRIVED',
                title: 'Armada Pengiriman Telah Tiba!',
                body: `Pengiriman ${shipment.shipmentNo} telah sampai di ${shipment.kitchen.name}. Silakan catat kuantitas serah terima bahan.`,
                link: '/kitchen/receiving',
              },
              tx,
            );
          }
          // Beri tahu pengawas mutu (Quality Inspector) wilayah tersebut
          const inspectors = await tx.user.findMany({
            where: {
              role: Role.QUALITY_INSPECTOR,
              status: 'ACTIVE',
              ...(shipment.kitchen.regionId ? { regionId: shipment.kitchen.regionId } : {}),
            },
            select: { id: true },
          });
          for (const insp of inspectors) {
            await this.notificationsService.createNotification(
              {
                userId: insp.id,
                type: 'INSPECTION_PENDING',
                title: 'Bahan Segar Menunggu Uji Kontrol Mutu',
                body: `Batch dari armada ${shipment.shipmentNo} tiba di ${shipment.kitchen.name}. Siap untuk inspeksi QC dan penerbitan skor.`,
                link: '/inspector/queue',
              },
              tx,
            );
          }
        }
      }

      return {
        message: `Status pengiriman berhasil diubah menjadi ${targetStatus}`,
        shipment: updatedShipment,
      };
    });
  }
}
