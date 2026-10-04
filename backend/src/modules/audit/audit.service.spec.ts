import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'log-1',
            action: 'ORDER_ACCEPTED',
            entity: 'Order',
            entityId: 'ord-1',
            userId: 'user-1',
            meta: { orderNo: 'ORD-001' },
            createdAt: new Date('2026-10-12'),
            user: { id: 'user-1', name: 'Admin', role: 'ADMIN' },
          },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('log() berhasil menyimpan entri dan menyaring parameter sensitif', async () => {
    await service.log({
      action: 'LOGIN',
      entity: 'User',
      userId: 'user-1',
      meta: { password: 'secret123', token: 'jwt-token', ip: '127.0.0.1' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'LOGIN',
        entity: 'User',
        userId: 'user-1',
        meta: { ip: '127.0.0.1' }, // password dan token tersanitasi
      }),
    });
  });

  it('findAll() mendukung paginasi dan filter entitas', async () => {
    const res = await service.findAll({ entity: 'Order', page: 1, limit: 10 });
    expect(res.data.length).toBe(1);
    expect(res.meta.total).toBe(1);
    expect(prisma.auditLog.findMany).toHaveBeenCalled();
  });
});
