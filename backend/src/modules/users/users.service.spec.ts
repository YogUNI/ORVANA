import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('createUser', () => {
    it('harus menolak pembuatan peran publik (SUPPLIER) dengan ForbiddenException', async () => {
      await expect(
        service.createUser(
          {
            name: 'Petani Budi',
            email: 'petani@test.com',
            password: 'Password123',
            role: Role.SUPPLIER,
          },
          'admin-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('harus menolak jika email sudah terdaftar dengan ConflictException', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'exist@test.com' });

      await expect(
        service.createUser(
          {
            name: 'Inspector Baru',
            email: 'exist@test.com',
            password: 'Password123',
            role: Role.QUALITY_INSPECTOR,
          },
          'admin-id',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('harus berhasil membuat peran internal (QUALITY_INSPECTOR) dengan status ACTIVE dan mencatat audit', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }: any) => {
        const { passwordHash, ...rest } = data;
        return {
          id: 'new-inspector',
          ...rest,
        };
      });

      const res = await service.createUser(
        {
          name: 'Pengawas Mutu',
          email: 'mutu@orvana.test',
          password: 'Password123',
          role: Role.QUALITY_INSPECTOR,
        },
        'admin-id',
      );

      expect(res.id).toBe('new-inspector');
      expect(res.status).toBe(UserStatus.ACTIVE);
      expect((res as any).passwordHash).toBeUndefined();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_CREATED',
          entity: 'User',
          entityId: 'new-inspector',
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('harus melempar NotFoundException bila user tidak ditemukan', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('random-id', { status: UserStatus.ACTIVE }, 'admin-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('harus menaikkan tokenVersion saat akun diubah ke SUSPENDED dan mencatat audit', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        status: UserStatus.ACTIVE,
        tokenVersion: 0,
      });

      prisma.user.update.mockImplementation(({ data }: any) => ({
        id: 'u1',
        status: data.status,
        tokenVersion: 1,
      }));

      const res = await service.updateStatus(
        'u1',
        { status: UserStatus.SUSPENDED, reason: 'Pelanggaran regulasi' },
        'admin-id',
        '127.0.0.1',
      );

      expect(res.status).toBe(UserStatus.SUSPENDED);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: UserStatus.SUSPENDED,
            tokenVersion: { increment: 1 },
          }),
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_STATUS_UPDATED',
          meta: expect.objectContaining({
            tokensRevoked: true,
          }),
        }),
      );
    });

    it('harus mengaktifkan akun PENDING menjadi ACTIVE tanpa menaikkan tokenVersion', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u2',
        status: UserStatus.PENDING,
        tokenVersion: 0,
      });

      prisma.user.update.mockImplementation(({ data }: any) => ({
        id: 'u2',
        status: data.status,
        tokenVersion: 0,
      }));

      const res = await service.updateStatus(
        'u2',
        { status: UserStatus.ACTIVE },
        'admin-id',
      );

      expect(res.status).toBe(UserStatus.ACTIVE);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: UserStatus.ACTIVE,
          },
        }),
      );
    });
  });
});
