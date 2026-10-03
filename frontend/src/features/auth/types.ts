export type Role =
  | 'ADMIN'
  | 'KITCHEN_MANAGER'
  | 'SUPPLIER'
  | 'COORDINATOR'
  | 'QUALITY_INSPECTOR'
  | 'AUDITOR';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export type SupplierType = 'FARMER' | 'FISHER' | 'LIVESTOCK' | 'PROCESSOR';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  status: UserStatus;
  regionId?: string | null;
  region?: { id: string; name: string; province: string } | null;
  supplierProfile?: {
    id: string;
    displayName: string;
    type: SupplierType;
    qualityScore: number;
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  coordinatorProfile?: {
    id: string;
    organizationName: string;
    collectionPointName: string;
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  kitchens?: Array<{
    id: string;
    code: string;
    name: string;
    address: string;
    portionCapacity: number;
  }>;
  unreadNotificationsCount?: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
