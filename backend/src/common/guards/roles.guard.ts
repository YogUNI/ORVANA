import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, UserStatus } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    // Jika endpoint tidak membatasi peran (@Roles tidak disematkan), izinkan akses
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Autentikasi diperlukan untuk mengakses sumber daya ini.',
      });
    }

    // 1. Periksa apakah akun ditangguhkan (SUSPENDED)
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_SUSPENDED',
        message: 'Akun Anda ditangguhkan. Hubungi admin dinas.',
      });
    }

    // 2. Periksa apakah akun masih menunggu verifikasi (PENDING)
    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'Akun Anda sedang menunggu verifikasi admin dinas.',
      });
    }

    // 3. Periksa apakah peran pengguna ada di daftar requiredRoles
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki hak akses untuk fitur ini.',
      });
    }

    return true;
  }
}
