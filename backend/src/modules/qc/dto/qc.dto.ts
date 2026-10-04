import {
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsArray,
  IsObject,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReceiveOrderDto {
  @ApiProperty({
    description: 'Kuantitas bahan pangan yang diterima secara fisik di dapur (kg)',
    example: 40.0,
  })
  @IsNumber({}, { message: 'receivedQuantity harus berupa angka' })
  @Min(0, { message: 'receivedQuantity tidak boleh negatif' })
  receivedQuantity!: number;

  @ApiProperty({
    description: 'Catatan serah terima (wajib diisi bila terdapat selisih > 2%)',
    example: 'Kondisi barang segar, diterima langsung oleh tim dapur',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'note harus berupa teks' })
  note?: string;

  @ApiProperty({
    description: 'URL foto dokumentasi serah terima di dapur',
    example: ['/uploads/serah-terima-1.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'photoUrls harus berupa array string' })
  @IsString({ each: true, message: 'Setiap URL foto harus berupa teks' })
  photoUrls?: string[];
}

export class SubmitQualityCheckDto {
  @ApiProperty({
    description: 'Skor checklist per aspek mutu: { [key: string]: number (0..100) }',
    example: {
      freshness: 90,
      physicalCondition: 85,
      sizeUniformity: 85,
      cleanliness: 90,
      handlingTemperature: 85,
    },
  })
  @IsObject({ message: 'checklistScores harus berupa objek skor kriteria' })
  checklistScores!: Record<string, number>;

  @ApiProperty({
    description: 'Jumlah kuantitas yang lolos dan diterima (kg)',
    example: 40.0,
  })
  @IsNumber({}, { message: 'acceptedQuantity harus berupa angka' })
  @Min(0, { message: 'acceptedQuantity tidak boleh negatif' })
  acceptedQuantity!: number;

  @ApiProperty({
    description: 'Jumlah kuantitas yang ditolak/rusak (kg)',
    example: 0.0,
  })
  @IsNumber({}, { message: 'rejectedQuantity harus berupa angka' })
  @Min(0, { message: 'rejectedQuantity tidak boleh negatif' })
  rejectedQuantity!: number;

  @ApiProperty({
    description: 'Catatan hasil inspeksi mutu (wajib minimal 10 karakter jika ada kuantitas ditolak)',
    example: 'Kondisi bayam segar optimal, kadar air sesuai standar higienis',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'notes harus berupa teks' })
  notes?: string;

  @ApiProperty({
    description: 'URL foto bukti inspeksi mutu',
    example: ['/uploads/qc-bayam-1.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'photoUrls harus berupa array string' })
  @IsString({ each: true, message: 'Setiap URL foto harus berupa teks' })
  photoUrls?: string[];
}
