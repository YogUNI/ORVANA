import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QualityChecklistItemDto {
  @ApiProperty({ example: 'freshness', description: 'Kode pengenal kriteria mutu' })
  @IsString()
  @IsNotEmpty({ message: 'Kunci item checklist wajib diisi' })
  key!: string;

  @ApiProperty({ example: 'Kesegaran', description: 'Label nama kriteria mutu' })
  @IsString()
  @IsNotEmpty({ message: 'Label item checklist wajib diisi' })
  label!: string;

  @ApiProperty({ example: 40, description: 'Bobot kriteria (jumlah bobot seluruh item harus = 100)' })
  @IsNumber({}, { message: 'Bobot item harus berupa angka' })
  @Min(1, { message: 'Bobot minimal 1' })
  @Max(100, { message: 'Bobot maksimal 100' })
  weight!: number;
}

export class SetQualityStandardDto {
  @ApiProperty({ example: 70, default: 70, description: 'Skor kelulusan minimum mutu (0 - 100)' })
  @IsInt({ message: 'Pass score harus berupa bilangan bulat' })
  @Min(0)
  @Max(100)
  passScore: number = 70;

  @ApiProperty({
    type: [QualityChecklistItemDto],
    description: 'Daftar kriteria pemeriksaan checklist mutu',
  })
  @IsArray({ message: 'Checklist harus berupa array' })
  @ValidateNested({ each: true })
  @Type(() => QualityChecklistItemDto)
  checklist!: QualityChecklistItemDto[];
}
