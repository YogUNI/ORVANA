import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePriceReferenceDto {
  @ApiProperty({ description: 'ID Komoditas' })
  @IsString()
  @IsNotEmpty({ message: 'Commodity ID wajib diisi' })
  commodityId!: string;

  @ApiProperty({ description: 'ID Wilayah berlaku' })
  @IsString()
  @IsNotEmpty({ message: 'Region ID wajib diisi' })
  regionId!: string;

  @ApiProperty({ example: 6000, description: 'Harga dasar produsen (floor price) per kg' })
  @IsNumber({}, { message: 'Harga dasar harus berupa angka' })
  @Min(1, { message: 'Harga dasar harus lebih besar dari 0' })
  floorPrice!: number;

  @ApiProperty({ example: 8000, description: 'Harga acuan wajar (reference price) per kg' })
  @IsNumber({}, { message: 'Harga acuan harus berupa angka' })
  @Min(1, { message: 'Harga acuan harus lebih besar dari 0' })
  referencePrice!: number;

  @ApiProperty({ example: 12000, description: 'Harga batas atas (ceiling price) per kg' })
  @IsNumber({}, { message: 'Batas atas harga harus berupa angka' })
  @Min(1, { message: 'Batas atas harga harus lebih besar dari 0' })
  ceilingPrice!: number;

  @ApiProperty({ example: '2026-01-01', description: 'Tanggal mulai berlaku (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'Format tanggal validFrom harus YYYY-MM-DD' })
  validFrom!: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Tanggal berakhir berlaku (opsional)' })
  @IsOptional()
  @IsDateString({}, { message: 'Format tanggal validTo harus YYYY-MM-DD' })
  validTo?: string;
}
