import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';
import { UserStatus } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_ACCESS_SECRET') ||
        'super-secret-jwt-access-key-change-in-production-min-32-chars',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, status: true, tokenVersion: true, role: true, regionId: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Pengguna tidak ditemukan atau sesi telah berakhir.',
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

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      regionId: user.regionId,
      tokenVersion: user.tokenVersion,
    };
  }
}
