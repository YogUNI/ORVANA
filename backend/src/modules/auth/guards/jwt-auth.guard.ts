import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException({
          code: 'UNAUTHORIZED',
          message: 'Sesi login tidak valid atau telah kedaluwarsa.',
        })
      );
    }
    return user;
  }
}
