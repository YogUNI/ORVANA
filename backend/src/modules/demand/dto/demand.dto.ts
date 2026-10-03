import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { DemandStatus } from '@prisma/client';

export class UpdateDemandRequestDto {
  @ApiPropertyOptional({ description: 'Kuantitas kebutuhan bahan (kg)', example: 69.0 })
  @IsNumber()
  @IsPositive({ message: 'Kuantitas kebutuhan harus lebih besar dari 0' })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Harga batas maksimum per kg (Rp)', example: 8000 })
  @IsNumber()
  @IsPositive({ message: 'Harga maksimum per unit harus lebih besar dari 0' })
  @IsOptional()
  maxPricePerUnit?: number;

  @ApiPropertyOptional({ description: 'Skor mutu minimum pemasok (0-100)', example: 60 })
  @IsInt()
  @Min(0, { message: 'Skor mutu minimal 0' })
  @Max(100, { message: 'Skor mutu maksimal 100' })
  @IsOptional()
  minQualityScore?: number;

  @ApiPropertyOptional({ description: 'Catatan tambahan pengelola dapur' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class FilterDemandRequestDto {
  @ApiPropertyOptional({ enum: DemandStatus, description: 'Filter status permintaan' })
  @IsEnum(DemandStatus)
  @IsOptional()
  status?: DemandStatus;

  @ApiPropertyOptional({ description: 'Filter tanggal awal (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ description: 'Filter tanggal akhir (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({ description: 'Filter ID komoditas' })
  @IsString()
  @IsOptional()
  commodityId?: string;

  @ApiPropertyOptional({ description: 'Filter ID dapur' })
  @IsString()
  @IsOptional()
  kitchenId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;
}

export class CancelDemandDto {
  @ApiPropertyOptional({ description: 'Alasan pembatalan permintaan' })
  @IsString()
  @IsOptional()
  reason?: string;
}
