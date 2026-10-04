import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplierReviewDto {
  @ApiProperty({
    description: 'Rating bintang ulasan pemasok (1 hingga 5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: 'Rating harus berupa angka bulat antara 1 sampai 5' })
  @Min(1, { message: 'Rating minimal 1 bintang' })
  @Max(5, { message: 'Rating maksimal 5 bintang' })
  rating!: number;

  @ApiProperty({
    description: 'Komentar catatan mutu, kemasan, atau ketepatan pengantaran',
    example: 'Bayam sangat segar, bersih, dan pengemasan daun rapi sesuai standar gizi.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Komentar ulasan harus berupa teks' })
  comment?: string;
}
