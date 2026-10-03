import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role, UserStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { QueryUsersDto } from './dto/query-users.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Mengambil daftar pengguna dengan filter, pencarian, dan paginasi (khusus ADMIN)
   */
  async findAll(query: QueryUsersDto) {
    const { page = 1, limit = 20, role, status, q } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          regionId: true,
          createdAt: true,
          updatedAt: true,
          region: {
            select: { id: true, name: true, province: true },
          },
          supplierProfile: {
            select: { id: true, displayName: true, type: true, qualityScore: true },
          },
          coordinatorProfile: {
            select: { id: true, organizationName: true, collectionPointName: true },
          },
          kitchens: {
            select: { id: true, code: true, name: true },
          },
        },
      }),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * Mengambil detail satu pengguna (khusus ADMIN)
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        regionId: true,
        createdAt: true,
        updatedAt: true,
        region: true,
        supplierProfile: true,
        coordinatorProfile: true,
        kitchens: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Pengguna tidak ditemukan.',
      });
    }

    return user;
  }

  /**
   * Membuat pengguna internal baru (ADMIN, QUALITY_INSPECTOR, AUDITOR) oleh Admin
   */
  async createUser(dto: CreateUserDto, adminId: string, ipAddress?: string) {
    const allowedInternalRoles: Role[] = [Role.ADMIN, Role.QUALITY_INSPECTOR, Role.AUDITOR];
    if (!allowedInternalRoles.includes(dto.role)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Endpoint ini hanya untuk membuat peran internal (ADMIN, QUALITY_INSPECTOR, AUDITOR).',
      });
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email sudah digunakan.',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
        phone: dto.phone,
        role: dto.role,
        status: UserStatus.ACTIVE, // Akun internal yang dibuat admin langsung aktif
        regionId: dto.regionId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        regionId: true,
        createdAt: true,
      },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      meta: {
        createdRole: user.role,
        email: user.email,
      },
      ipAddress,
    });

    return user;
  }

  /**
   * Mengubah status pengguna (verifikasi ke ACTIVE atau penangguhan ke SUSPENDED)
   */
  async updateStatus(
    id: string,
    dto: UpdateUserStatusDto,
    adminId: string,
    ipAddress?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Pengguna tidak ditemukan.',
      });
    }

    // Jika ditangguhkan (SUSPENDED), naikkan tokenVersion untuk membatalkan seluruh sesi/refresh token
    const shouldRevokeTokens = dto.status === UserStatus.SUSPENDED;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        status: dto.status,
        ...(shouldRevokeTokens ? { tokenVersion: { increment: 1 } } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        tokenVersion: true,
        updatedAt: true,
      },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'USER_STATUS_UPDATED',
      entity: 'User',
      entityId: user.id,
      meta: {
        oldStatus: user.status,
        newStatus: dto.status,
        reason: dto.reason,
        tokensRevoked: shouldRevokeTokens,
      },
      ipAddress,
    });

    return {
      ...updatedUser,
      message:
        dto.status === UserStatus.ACTIVE
          ? 'Akun berhasil diverifikasi dan diaktifkan.'
          : 'Akun berhasil ditangguhkan dan seluruh sesi dibatalkan.',
    };
  }
}
