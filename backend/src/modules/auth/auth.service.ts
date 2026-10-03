import {
  Injectable,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'super-secret-jwt-access-key-change-in-production-min-32-chars';
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'super-secret-jwt-refresh-key-change-in-production-min-32-chars';
  }

  async register(dto: RegisterDto) {
    // 1. Batasi peran pendaftaran mandiri (hanya KITCHEN_MANAGER, SUPPLIER, COORDINATOR)
    const allowedRoles: Role[] = [Role.KITCHEN_MANAGER, Role.SUPPLIER, Role.COORDINATOR];
    if (!allowedRoles.includes(dto.role)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Peran ini hanya dapat dibuat oleh Admin.',
      });
    }

    // 2. Periksa apakah email sudah terdaftar
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email sudah digunakan.',
      });
    }

    // 3. Hash kata sandi dengan bcrypt (salt 10)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 4. Eksekusi pembuatan user dan profil dalam transaksi Prisma ($transaction)
    const createdUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          passwordHash,
          phone: dto.phone,
          role: dto.role,
          status: UserStatus.PENDING,
          regionId: dto.regionId,
        },
      });

      if (dto.role === Role.SUPPLIER && dto.supplierProfile) {
        await tx.supplierProfile.create({
          data: {
            userId: user.id,
            displayName: dto.supplierProfile.displayName,
            publicName: dto.supplierProfile.publicName ?? false,
            type: dto.supplierProfile.type,
            address: dto.supplierProfile.address,
            village: dto.supplierProfile.village,
            latitude: dto.supplierProfile.latitude,
            longitude: dto.supplierProfile.longitude,
            regionId: dto.regionId || 'default-region',
            qualityScore: 70,
            reliabilityRate: 0.8,
          },
        });
      } else if (dto.role === Role.COORDINATOR && dto.coordinatorProfile) {
        await tx.coordinatorProfile.create({
          data: {
            userId: user.id,
            organizationName: dto.coordinatorProfile.organizationName,
            collectionPointName: dto.coordinatorProfile.collectionPointName,
            address: dto.coordinatorProfile.address,
            latitude: dto.coordinatorProfile.latitude,
            longitude: dto.coordinatorProfile.longitude,
            regionId: dto.regionId || 'default-region',
          },
        });
      } else if (dto.role === Role.KITCHEN_MANAGER && dto.kitchenProfile) {
        await tx.kitchen.create({
          data: {
            code: dto.kitchenProfile.code,
            name: dto.kitchenProfile.name,
            address: dto.kitchenProfile.address,
            portionCapacity: dto.kitchenProfile.portionCapacity,
            latitude: dto.kitchenProfile.latitude,
            longitude: dto.kitchenProfile.longitude,
            regionId: dto.regionId || 'default-region',
            managerId: user.id,
          },
        });
      }

      return user;
    });

    return {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      status: createdUser.status,
      regionId: createdUser.regionId,
      message: 'Pendaftaran berhasil. Akun Anda sedang menunggu verifikasi admin dinas.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email atau kata sandi tidak sesuai.',
      });
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_SUSPENDED',
        message: 'Akun Anda ditangguhkan. Hubungi admin dinas.',
      });
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email atau kata sandi tidak sesuai.',
      });
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      regionId: user.regionId,
      tokenVersion: user.tokenVersion,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        regionId: user.regionId,
      },
      ...tokens,
    };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.refreshSecret,
      });
    } catch (e) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token tidak valid atau telah kedaluwarsa.',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Pengguna tidak ditemukan.',
      });
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_SUSPENDED',
        message: 'Akun Anda ditangguhkan. Hubungi admin dinas.',
      });
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException({
        code: 'TOKEN_REVOKED',
        message: 'Sesi telah dicabut, silakan masuk kembali.',
      });
    }

    // Rotasi token
    return this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      regionId: user.regionId,
      tokenVersion: user.tokenVersion,
    });
  }

  async logout(userId: string) {
    // Naikkan tokenVersion untuk membatalkan semua refresh token
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });

    return { message: 'Berhasil keluar.' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        regionId: true,
        region: true,
        supplierProfile: true,
        coordinatorProfile: true,
        kitchens: true,
        _count: {
          select: {
            notifications: {
              where: { readAt: null },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Data pengguna tidak ditemukan.',
      });
    }

    return {
      ...user,
      unreadNotificationsCount: user._count.notifications,
    };
  }

  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 menit dalam detik
    };
  }
}
