import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiProperty({
    example: 'matching.weights',
    description: 'Kunci konfigurasi sistem yang akan diubah',
  })
  @IsString()
  @IsNotEmpty({ message: 'Kunci pengaturan wajib diisi' })
  key!: string;

  @ApiProperty({
    example: { distance: 0.3, quality: 0.3, price: 0.2, freshness: 0.1, reliability: 0.1 },
    description: 'Nilai baru konfigurasi sistem',
  })
  @IsNotEmpty({ message: 'Nilai pengaturan wajib diisi' })
  value!: any;
}
