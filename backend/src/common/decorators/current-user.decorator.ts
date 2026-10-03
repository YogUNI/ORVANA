import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  status: UserStatus;
  regionId: string | null;
  tokenVersion: number;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
