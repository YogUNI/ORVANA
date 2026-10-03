import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      supplierProfile: {
        create: jest.fn(),
      },
      coordinatorProfile: {
        create: jest.fn(),
      },
      kitchen: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'test-access-secret';
              if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('harus menolak pendaftaran peran ADMIN dengan ForbiddenException', async () => {
      await expect(
        service.register({
          name: 'Admin Test',
          email: 'admin@test.com',
          password: 'Password123',
          role: Role.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('harus menolak pendaftaran peran AUDITOR atau QUALITY_INSPECTOR secara publik', async () => {
      await expect(
        service.register({
          name: 'Auditor Test',
          email: 'auditor@test.com',
          password: 'Password123',
          role: Role.AUDITOR,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('harus menolak email yang sudah terdaftar dengan ConflictException', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'exist@test.com' });

      await expect(
        service.register({
          name: 'Petani Budi',
          email: 'exist@test.com',
          password: 'Password123',
          role: Role.SUPPLIER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('harus berhasil mendaftarkan pemasok dengan status PENDING dan password ter-hash', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }: any) => ({
        id: 'u-new',
        ...data,
      }));

      const res = await service.register({
        name: 'Petani Baru',
        email: 'petani@test.com',
        password: 'Password123',
        role: Role.SUPPLIER,
      });

      expect(res.id).toBe('u-new');
      expect(res.status).toBe(UserStatus.PENDING);
      expect((res as any).passwordHash).toBeUndefined(); // tidak boleh bocor
    });
  });

  describe('login', () => {
    it('harus menolak login dengan UnauthorizedException bila akun SUSPENDED', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'suspended@test.com',
        passwordHash: await bcrypt.hash('Password123', 10),
        status: UserStatus.SUSPENDED,
      });

      await expect(
        service.login({
          email: 'suspended@test.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('harus menolak login bila kata sandi salah', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@test.com',
        passwordHash: await bcrypt.hash('Password123', 10),
        status: UserStatus.ACTIVE,
      });

      await expect(
        service.login({
          email: 'user@test.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('harus berhasil login dan mengembalikan tokens untuk akun valid', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        name: 'User Demo',
        email: 'user@test.com',
        passwordHash: await bcrypt.hash('Password123', 10),
        role: Role.SUPPLIER,
        status: UserStatus.ACTIVE,
        regionId: 'r1',
        tokenVersion: 0,
      });

      const res = await service.login({
        email: 'user@test.com',
        password: 'Password123',
      });

      expect(res.accessToken).toBe('mock-token');
      expect(res.refreshToken).toBe('mock-token');
      expect(res.user.email).toBe('user@test.com');
      expect((res.user as any).passwordHash).toBeUndefined();
    });
  });
});
