import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectOrderDto {
  @ApiProperty({
    description: 'Alasan penolakan pesanan oleh pemasok (minimal 5 karakter)',
    example: 'Kapasitas produksi panen minggu ini sudah penuh',
  })
  @IsString({ message: 'Alasan penolakan harus berupa teks' })
  @IsNotEmpty({ message: 'Alasan penolakan wajib diisi' })
  @MinLength(5, { message: 'Alasan penolakan minimal 5 karakter' })
  reason!: string;
}

export class CancelOrderDto {
  @ApiProperty({
    description: 'Alasan pembatalan pesanan oleh admin',
    example: 'Dapur membatalkan menu makan siang terkait hari libur daerah',
    required: false,
  })
  reason?: string;
}
