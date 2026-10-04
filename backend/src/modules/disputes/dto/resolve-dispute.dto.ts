import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeOutcome } from '@prisma/client';

export class ResolveDisputeDto {
  @ApiProperty({
    description: 'Hasil putusan sengketa oleh Admin',
    enum: DisputeOutcome,
    example: DisputeOutcome.SPLIT,
  })
  @IsEnum(DisputeOutcome, {
    message: 'Hasil putusan harus salah satu dari: FAVOR_SUPPLIER, FAVOR_KITCHEN, atau SPLIT',
  })
  @IsNotEmpty({ message: 'Hasil putusan wajib dipilih' })
  outcome!: DisputeOutcome;

  @ApiPropertyOptional({
    description:
      'Kuantitas penerimaan yang disesuaikan dalam kg (wajib diisi bila putusan SPLIT)',
    example: 27.0,
  })
  @ValidateIf((o) => o.outcome === DisputeOutcome.SPLIT)
  @IsNotEmpty({
    message: 'Kuantitas penyesuaian (adjustedAcceptedQuantity) wajib diisi untuk putusan SPLIT',
  })
  @IsNumber({}, { message: 'Kuantitas penyesuaian harus berupa angka numerik' })
  @Min(0, { message: 'Kuantitas penyesuaian tidak boleh negatif' })
  adjustedAcceptedQuantity?: number;

  @ApiPropertyOptional({
    description: 'Catatan pertimbangan putusan oleh Admin (minimal 5 karakter)',
    example: 'Disepakati kompromi kuantitas layak konsumsi sebesar 27 kg.',
  })
  @IsOptional()
  @IsString({ message: 'Catatan putusan harus berupa teks' })
  @MinLength(5, { message: 'Catatan putusan minimal 5 karakter' })
  resolutionNote?: string;
}
