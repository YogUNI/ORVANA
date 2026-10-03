import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommodityCategory } from '@prisma/client';

export class CreateCommodityDto {
  @ApiProperty({ example: 'Bayam', description: 'Nama komoditas pangan' })
  @IsString()
  @IsNotEmpty({ message: 'Nama komoditas wajib diisi' })
  name!: string;

  @ApiProperty({ enum: CommodityCategory, description: 'Kategori komoditas' })
  @IsEnum(CommodityCategory, { message: 'Kategori komoditas tidak valid' })
  category!: CommodityCategory;

  @ApiProperty({ example: 'kg', default: 'kg', description: 'Satuan komoditas (MVP wajib kg)' })
  @IsString()
  @IsNotEmpty()
  unit: string = 'kg';

  @ApiProperty({ example: 3, description: 'Masa simpan komoditas dalam hari' })
  @IsInt({ message: 'Masa simpan harus berupa bilangan bulat hari' })
  @Min(1, { message: 'Masa simpan minimal 1 hari' })
  shelfLifeDays!: number;

  @ApiPropertyOptional({ example: 15.0, description: 'Persentase susut pembersihan (0 - 100%)' })
  @IsOptional()
  @IsNumber({}, { message: 'Persentase susut harus berupa angka' })
  @Min(0, { message: 'Persentase susut minimal 0%' })
  wastePercent: number = 0;

  @ApiPropertyOptional({ default: true, description: 'Status keaktifan komoditas' })
  @IsOptional()
  @IsBoolean()
  isActive: boolean = true;
}

export class UpdateCommodityDto {
  @ApiPropertyOptional({ example: 'Bayam Hijau', description: 'Nama komoditas pangan' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: CommodityCategory, description: 'Kategori komoditas' })
  @IsOptional()
  @IsEnum(CommodityCategory)
  category?: CommodityCategory;

  @ApiPropertyOptional({ example: 3, description: 'Masa simpan dalam hari' })
  @IsOptional()
  @IsInt()
  @Min(1)
  shelfLifeDays?: number;

  @ApiPropertyOptional({ example: 15.0, description: 'Persentase susut pembersihan' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  wastePercent?: number;

  @ApiPropertyOptional({ description: 'Status keaktifan komoditas' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
