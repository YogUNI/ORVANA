import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsPositive,
  IsDateString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class CreateMenuPlanDto {
  @ApiProperty({ description: 'ID Resep baku yang disajikan' })
  @IsString()
  @IsNotEmpty({ message: 'Resep wajib dipilih' })
  recipeId!: string;

  @ApiProperty({ description: 'Tanggal layanan (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'Format tanggal harus YYYY-MM-DD' })
  serviceDate!: string;

  @ApiProperty({ description: 'Jumlah porsi sajian gizi', example: 1000 })
  @IsInt({ message: 'Porsi harus bilangan bulat' })
  @IsPositive({ message: 'Porsi harus lebih besar dari 0' })
  portions!: number;
}

export class UpdateMenuPlanDto {
  @ApiPropertyOptional({ description: 'ID Resep baku baru' })
  @IsString()
  @IsOptional()
  recipeId?: string;

  @ApiPropertyOptional({ description: 'Jumlah porsi baru' })
  @IsInt({ message: 'Porsi harus bilangan bulat' })
  @IsPositive({ message: 'Porsi harus lebih besar dari 0' })
  @IsOptional()
  portions?: number;
}

export class GenerateDemandDto {
  @ApiProperty({ description: 'Tanggal awal rentang menu (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'Format tanggal awal harus YYYY-MM-DD' })
  from!: string;

  @ApiProperty({ description: 'Tanggal akhir rentang menu (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'Format tanggal akhir harus YYYY-MM-DD' })
  to!: string;
}
