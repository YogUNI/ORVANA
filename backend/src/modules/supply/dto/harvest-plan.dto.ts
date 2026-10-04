import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHarvestPlanDto {
  @ApiProperty({
    description: 'ID Komoditas pangan yang akan dipanen',
    example: 'comm-bayam-01',
  })
  @IsString({ message: 'Komoditas wajib berupa string ID' })
  @IsNotEmpty({ message: 'Komoditas wajib dipilih' })
  commodityId!: string;

  @ApiProperty({
    description: 'Estimasi kuantitas hasil panen dalam kg (minimal 0.1 kg)',
    example: 150.0,
  })
  @IsNumber({}, { message: 'Kuantitas panen harus berupa angka numerik' })
  @Min(0.1, { message: 'Kuantitas panen minimal 0.1 kg' })
  expectedQuantity!: number;

  @ApiProperty({
    description: 'Estimasi tanggal panen (format YYYY-MM-DD)',
    example: '2026-10-25',
  })
  @IsDateString({}, { message: 'Format tanggal panen tidak valid (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Tanggal panen wajib diisi' })
  expectedHarvestDate!: string;

  @ApiPropertyOptional({
    description: 'Catatan tambahan seperti varietas bibit, metode tanam, atau perkiraan luas lahan',
    example: 'Varietas bayam hijau cabut organik, panen bertahap 2 hari.',
  })
  @IsOptional()
  @IsString({ message: 'Catatan harus berupa teks' })
  notes?: string;
}

export class UpdateHarvestPlanDto {
  @ApiPropertyOptional({
    description: 'Estimasi kuantitas hasil panen dalam kg (minimal 0.1 kg)',
    example: 180.0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Kuantitas panen harus berupa angka numerik' })
  @Min(0.1, { message: 'Kuantitas panen minimal 0.1 kg' })
  expectedQuantity?: number;

  @ApiPropertyOptional({
    description: 'Estimasi tanggal panen (format YYYY-MM-DD)',
    example: '2026-10-26',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Format tanggal panen tidak valid (YYYY-MM-DD)' })
  expectedHarvestDate?: string;

  @ApiPropertyOptional({
    description: 'Catatan tambahan',
    example: 'Kondisi cuaca cerah mendukung masa panen.',
  })
  @IsOptional()
  @IsString({ message: 'Catatan harus berupa teks' })
  notes?: string;
}
