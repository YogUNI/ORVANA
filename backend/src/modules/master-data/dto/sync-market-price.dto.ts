import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SyncMarketPriceDto {
  @ApiPropertyOptional({
    description: 'ID Wilayah sasaran. Jika dikosongkan bersama syncAll=true, sinkronisasi semua wilayah.',
    example: 'uuid-region',
  })
  @IsOptional()
  @IsString()
  regionId?: string;

  @ApiPropertyOptional({
    description: 'Jika true, sinkronisasi SEMUA wilayah terdaftar sekaligus (Sinkronisasi Nasional).',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === true || value === 'true')
  syncAll?: boolean;
}
