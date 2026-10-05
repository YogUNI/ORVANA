import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncMarketPriceDto {
  @ApiPropertyOptional({
    description: 'ID Wilayah sasaran (default ke wilayah pertama jika dikosongkan)',
    example: 'uuid-region-demo',
  })
  @IsOptional()
  @IsString()
  regionId?: string;
}
