import { Role } from '@prisma/client';
import { JwtPayload } from '../decorators/current-user.decorator';

export type ScopedResource =
  | 'kitchen'
  | 'demandRequest'
  | 'supplyOffer'
  | 'harvestPlan'
  | 'order'
  | 'shipment'
  | 'batch'
  | 'ledgerEntry'
  | 'dispute';

export interface ScopedProfileIds {
  supplierProfileId?: string;
  coordinatorProfileId?: string;
  kitchenId?: string;
}

/**
 * Membangun filter objek WHERE Prisma berdasarkan peran dan identitas pengguna
 * Mengikuti spesifikasi docs/02-roles-permissions.md bagian 5.
 */
export function scopeWhere(
  user: JwtPayload,
  resource: ScopedResource,
  profileIds: ScopedProfileIds = {},
): Record<string, any> {
  // ADMIN memiliki akses menyeluruh ke semua data
  if (user.role === Role.ADMIN) {
    return {};
  }

  switch (resource) {
    case 'kitchen':
      if (user.role === Role.KITCHEN_MANAGER) {
        return { managerId: user.sub };
      }
      return {};

    case 'demandRequest':
      if (user.role === Role.KITCHEN_MANAGER) {
        // Dapur hanya melihat permintaannya sendiri
        return { kitchen: { managerId: user.sub } };
      }
      if (user.role === Role.COORDINATOR || user.role === Role.SUPPLIER) {
        // Koordinator dan pemasok melihat permintaan aktif pada wilayahnya
        return user.regionId ? { kitchen: { regionId: user.regionId } } : {};
      }
      return {};

    case 'supplyOffer':
    case 'harvestPlan':
      if (user.role === Role.SUPPLIER) {
        // Pemasok hanya melihat tawarannya sendiri
        return profileIds.supplierProfileId
          ? { supplierId: profileIds.supplierProfileId }
          : { supplier: { userId: user.sub } };
      }
      if (user.role === Role.KITCHEN_MANAGER || user.role === Role.COORDINATOR) {
        // Dapur & koordinator hanya melihat penawaran aktif di wilayahnya
        return user.regionId ? { supplier: { regionId: user.regionId } } : {};
      }
      return {};

    case 'order':
      if (user.role === Role.KITCHEN_MANAGER) {
        return { kitchen: { managerId: user.sub } };
      }
      if (user.role === Role.SUPPLIER) {
        return profileIds.supplierProfileId
          ? { supplierId: profileIds.supplierProfileId }
          : { supplier: { userId: user.sub } };
      }
      if (user.role === Role.COORDINATOR) {
        // Koordinator melihat order yang relevan di wilayahnya
        return user.regionId ? { kitchen: { regionId: user.regionId } } : {};
      }
      return {};

    case 'shipment':
      if (user.role === Role.COORDINATOR) {
        return profileIds.coordinatorProfileId
          ? { coordinatorId: profileIds.coordinatorProfileId }
          : { coordinator: { userId: user.sub } };
      }
      if (user.role === Role.KITCHEN_MANAGER) {
        return { kitchen: { managerId: user.sub } };
      }
      return {};

    case 'batch':
      if (user.role === Role.QUALITY_INSPECTOR) {
        return user.regionId ? { order: { kitchen: { regionId: user.regionId } } } : {};
      }
      if (user.role === Role.KITCHEN_MANAGER) {
        return { order: { kitchen: { managerId: user.sub } } };
      }
      if (user.role === Role.SUPPLIER) {
        return profileIds.supplierProfileId
          ? { order: { supplierId: profileIds.supplierProfileId } }
          : { order: { supplier: { userId: user.sub } } };
      }
      return {};

    case 'ledgerEntry':
      if (user.role === Role.KITCHEN_MANAGER) {
        return { order: { kitchen: { managerId: user.sub } } };
      }
      if (user.role === Role.SUPPLIER) {
        return profileIds.supplierProfileId
          ? { order: { supplierId: profileIds.supplierProfileId } }
          : { order: { supplier: { userId: user.sub } } };
      }
      if (user.role === Role.AUDITOR) {
        return {}; // Auditor membaca semua namun identitas disamarkan
      }
      return {};

    case 'dispute':
      if (user.role === Role.KITCHEN_MANAGER) {
        return { order: { kitchen: { managerId: user.sub } } };
      }
      if (user.role === Role.SUPPLIER) {
        return { order: { supplier: { userId: user.sub } } };
      }
      return {};

    default:
      return {};
  }
}
