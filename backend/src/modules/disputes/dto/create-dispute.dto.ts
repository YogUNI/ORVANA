import { IsString, IsNotEmpty, MinLength, IsOptional, IsArray, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDisputeDto {
  @ApiProperty({
    description: 'Alasan pengajuan sengketa mutu/pembayaran (minimal 20 karakter)',
    example: 'Kuantitas bayam yang dinyatakan rusak tidak sesuai dengan kondisi saat penyerahan di dapur.',
  })
  @IsString({ message: 'Alasan sengketa harus berupa teks' })
  @IsNotEmpty({ message: 'Alasan sengketa wajib diisi' })
  @MinLength(20, { message: 'Alasan sengketa wajib diisi minimal 20 karakter' })
  reason!: string;

  @ApiPropertyOptional({
    description: 'Daftar URL foto atau dokumen bukti pendukung',
    type: [String],
    example: ['https://example.com/uploads/bukti-serah-terima.jpg'],
  })
  @IsOptional()
  @IsArray({ message: 'Bukti harus berupa array URL' })
  @IsString({ each: true, message: 'Setiap URL bukti harus berupa teks' })
  evidenceUrls?: string[];
}
