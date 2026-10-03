import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { OfferStatus } from '@prisma/client';

export class CreateSupplyOfferDto {
  @ApiProperty({ description: 'ID Komoditas pangan yang ditawarkan' })
  @IsString()
  @IsNotEmpty({ message: 'Komoditas wajib dipilih' })
  commodityId!: string;

  @ApiProperty({ description: 'Kuantitas panen/stok tersedia (kg)', example: 40.0 })
  @IsNumber()
  @IsPositive({ message: 'Kuantitas harus lebih besar dari 0 kg' })
  quantityAvailable!: number;

  @ApiProperty({ description: 'Tanggal panen (YYYY-MM-DD)', example: '2026-10-12' })
  @IsDateString({}, { message: 'Format tanggal panen harus YYYY-MM-DD' })
  harvestDate!: string;

  @ApiProperty({ description: 'Harga ajuan pemasok per kg (Rp)', example: 8000 })
  @IsNumber()
  @IsPositive({ message: 'Harga ajuan harus lebih besar dari Rp 0' })
  askingPrice!: number;

  @ApiPropertyOptional({ description: 'Catatan sumber atau keterangan tambahan' })
  @IsString()
  @IsOptional()
  sourceText?: string;
}

export class UpdateSupplyOfferDto {
  @ApiPropertyOptional({ description: 'Kuantitas baru (tidak boleh di bawah kuantitas tereservasi)' })
  @IsNumber()
  @IsPositive({ message: 'Kuantitas harus lebih besar dari 0 kg' })
  @IsOptional()
  quantityAvailable?: number;

  @ApiPropertyOptional({ description: 'Tanggal panen (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'Format tanggal panen harus YYYY-MM-DD' })
  @IsOptional()
  harvestDate?: string;

  @ApiPropertyOptional({ description: 'Harga ajuan baru per kg (Rp)' })
  @IsNumber()
  @IsPositive({ message: 'Harga ajuan harus lebih besar dari Rp 0' })
  @IsOptional()
  askingPrice?: number;
}

export class FilterSupplyOfferDto {
  @ApiPropertyOptional({ enum: OfferStatus, description: 'Filter status penawaran' })
  @IsEnum(OfferStatus)
  @IsOptional()
  status?: OfferStatus;

  @ApiPropertyOptional({ description: 'Filter ID komoditas' })
  @IsString()
  @IsOptional()
  commodityId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;
}
