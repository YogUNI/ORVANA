import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('harus mengizinkan akses jika handler tidak membutuhkan peran (@Roles tidak ada)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext(undefined);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('harus menolak dengan UnauthorizedException jika tidak ada user pada endpoint berpelindung', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('harus menolak dengan ACCOUNT_NOT_ACTIVE jika status user PENDING', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.SUPPLIER]);
    const context = createMockContext({
      sub: 'u1',
      role: Role.SUPPLIER,
      status: UserStatus.PENDING,
    });

    expect(() => guard.canActivate(context)).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({ code: 'ACCOUNT_NOT_ACTIVE' }),
      }),
    );
  });

  it('harus menolak dengan ACCOUNT_SUSPENDED jika status user SUSPENDED', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.SUPPLIER]);
    const context = createMockContext({
      sub: 'u1',
      role: Role.SUPPLIER,
      status: UserStatus.SUSPENDED,
    });

    expect(() => guard.canActivate(context)).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({ code: 'ACCOUNT_SUSPENDED' }),
      }),
    );
  });

  it('harus menolak dengan FORBIDDEN jika peran pengguna tidak diizinkan', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext({
      sub: 'u1',
      role: Role.SUPPLIER,
      status: UserStatus.ACTIVE,
    });

    expect(() => guard.canActivate(context)).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({ code: 'FORBIDDEN' }),
      }),
    );
  });

  it('harus mengizinkan akses jika peran pengguna sesuai dan status ACTIVE', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.KITCHEN_MANAGER, Role.ADMIN]);
    const context = createMockContext({
      sub: 'u1',
      role: Role.KITCHEN_MANAGER,
      status: UserStatus.ACTIVE,
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
