import { Role, UserStatus } from '@prisma/client';
import { scopeWhere } from './scope-where.util';
import { JwtPayload } from '../decorators/current-user.decorator';

describe('scopeWhere', () => {
  const adminUser: JwtPayload = {
    sub: 'admin-1',
    email: 'admin@orvana.test',
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
    regionId: 'reg-1',
    tokenVersion: 0,
  };

  const kitchenUser: JwtPayload = {
    sub: 'kitchen-manager-1',
    email: 'dapur@orvana.test',
    role: Role.KITCHEN_MANAGER,
    status: UserStatus.ACTIVE,
    regionId: 'reg-1',
    tokenVersion: 0,
  };

  const supplierUser: JwtPayload = {
    sub: 'supplier-user-1',
    email: 'petani@orvana.test',
    role: Role.SUPPLIER,
    status: UserStatus.ACTIVE,
    regionId: 'reg-1',
    tokenVersion: 0,
  };

  it('ADMIN selalu mendapatkan scope kosong (tanpa batasan)', () => {
    expect(scopeWhere(adminUser, 'kitchen')).toEqual({});
    expect(scopeWhere(adminUser, 'order')).toEqual({});
    expect(scopeWhere(adminUser, 'shipment')).toEqual({});
  });

  it('KITCHEN_MANAGER dibatasi hanya untuk dapurnya', () => {
    expect(scopeWhere(kitchenUser, 'kitchen')).toEqual({ managerId: 'kitchen-manager-1' });
    expect(scopeWhere(kitchenUser, 'demandRequest')).toEqual({
      kitchen: { managerId: 'kitchen-manager-1' },
    });
    expect(scopeWhere(kitchenUser, 'order')).toEqual({
      kitchen: { managerId: 'kitchen-manager-1' },
    });
  });

  it('SUPPLIER dibatasi hanya untuk penawaran dan order miliknya', () => {
    expect(scopeWhere(supplierUser, 'supplyOffer')).toEqual({
      supplier: { userId: 'supplier-user-1' },
    });
    expect(
      scopeWhere(supplierUser, 'supplyOffer', { supplierProfileId: 'profile-1' }),
    ).toEqual({ supplierId: 'profile-1' });
  });
});
