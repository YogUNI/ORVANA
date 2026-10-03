import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, SupplierType } from '@prisma/client';

export class SupplierProfileDto {
  @ApiProperty({ description: 'Nama usaha atau kelompok tani' })
  @IsString()
  @IsNotEmpty({ message: 'Nama usaha/kelompok wajib diisi' })
  displayName!: string;

  @ApiPropertyOptional({ description: 'Izinkan nama tampil di halaman publik' })
  @IsOptional()
  @IsBoolean()
  publicName?: boolean;

  @ApiProperty({ enum: SupplierType, description: 'Tipe pemasok pangan' })
  @IsEnum(SupplierType, { message: 'Tipe pemasok harus FARMER, FISHER, LIVESTOCK, atau PROCESSOR' })
  type!: SupplierType;

  @ApiProperty({ description: 'Alamat lengkap lokasi pemasok' })
  @IsString()
  @IsNotEmpty({ message: 'Alamat wajib diisi' })
  address!: string;

  @ApiPropertyOptional({ description: 'Nama desa/kelurahan' })
  @IsOptional()
  @IsString()
  village?: string;

  @ApiProperty({ description: 'Titik koordinat latitude' })
  @IsNumber({}, { message: 'Latitude harus berupa angka' })
  latitude!: number;

  @ApiProperty({ description: 'Titik koordinat longitude' })
  @IsNumber({}, { message: 'Longitude harus berupa angka' })
  longitude!: number;
}

export class CoordinatorProfileDto {
  @ApiProperty({ description: 'Nama organisasi/koperasi pengumpul' })
  @IsString()
  @IsNotEmpty({ message: 'Nama organisasi wajib diisi' })
  organizationName!: string;

  @ApiProperty({ description: 'Nama titik kumpul pengiriman' })
  @IsString()
  @IsNotEmpty({ message: 'Nama titik kumpul wajib diisi' })
  collectionPointName!: string;

  @ApiProperty({ description: 'Alamat titik kumpul' })
  @IsString()
  @IsNotEmpty({ message: 'Alamat titik kumpul wajib diisi' })
  address!: string;

  @ApiProperty({ description: 'Titik koordinat latitude' })
  @IsNumber({}, { message: 'Latitude harus berupa angka' })
  latitude!: number;

  @ApiProperty({ description: 'Titik koordinat longitude' })
  @IsNumber({}, { message: 'Longitude harus berupa angka' })
  longitude!: number;
}

export class KitchenProfileDto {
  @ApiProperty({ description: 'Kode unik dapur (contoh: DPR01)' })
  @IsString()
  @IsNotEmpty({ message: 'Kode dapur wajib diisi' })
  code!: string;

  @ApiProperty({ description: 'Nama dapur gizi' })
  @IsString()
  @IsNotEmpty({ message: 'Nama dapur wajib diisi' })
  name!: string;

  @ApiProperty({ description: 'Alamat dapur gizi' })
  @IsString()
  @IsNotEmpty({ message: 'Alamat dapur wajib diisi' })
  address!: string;

  @ApiProperty({ description: 'Kapasitas porsi per hari' })
  @IsNumber({}, { message: 'Kapasitas porsi harus berupa angka' })
  portionCapacity!: number;

  @ApiProperty({ description: 'Titik koordinat latitude' })
  @IsNumber({}, { message: 'Latitude harus berupa angka' })
  latitude!: number;

  @ApiProperty({ description: 'Titik koordinat longitude' })
  @IsNumber({}, { message: 'Longitude harus berupa angka' })
  longitude!: number;
}

export class RegisterDto {
  @ApiProperty({ example: 'Budi Santoso', description: 'Nama lengkap pengguna' })
  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap wajib diisi' })
  name!: string;

  @ApiProperty({ example: 'budi@example.com', description: 'Alamat email aktif' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @ApiProperty({
    example: 'Rahasia123',
    description: 'Kata sandi minimal 8 karakter dan mengandung minimal 1 angka',
  })
  @IsString()
  @MinLength(8, { message: 'Kata sandi minimal 8 karakter' })
  @Matches(/(?=.*\d)/, { message: 'Kata sandi harus mengandung minimal 1 angka' })
  password!: string;

  @ApiPropertyOptional({ example: '081234567890', description: 'Nomor telepon aktif' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    enum: [Role.KITCHEN_MANAGER, Role.SUPPLIER, Role.COORDINATOR],
    description: 'Peran pendaftar mandiri',
  })
  @IsEnum(Role, { message: 'Peran harus KITCHEN_MANAGER, SUPPLIER, atau COORDINATOR' })
  role!: Role;

  @ApiPropertyOptional({ description: 'ID Wilayah' })
  @IsOptional()
  @IsString()
  regionId?: string;

  @ApiPropertyOptional({ type: SupplierProfileDto, description: 'Profil khusus jika peran SUPPLIER' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SupplierProfileDto)
  supplierProfile?: SupplierProfileDto;

  @ApiPropertyOptional({
    type: CoordinatorProfileDto,
    description: 'Profil khusus jika peran COORDINATOR',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatorProfileDto)
  coordinatorProfile?: CoordinatorProfileDto;

  @ApiPropertyOptional({
    type: KitchenProfileDto,
    description: 'Profil khusus jika peran KITCHEN_MANAGER',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => KitchenProfileDto)
  kitchenProfile?: KitchenProfileDto;
}
