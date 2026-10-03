import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecipeItemDto {
  @ApiProperty({ description: 'ID Komoditas' })
  @IsString()
  @IsNotEmpty({ message: 'Commodity ID wajib diisi' })
  commodityId!: string;

  @ApiProperty({
    example: 0.06,
    description: 'Takaran bahan baku dalam satuan kg per satu porsi hidangan',
  })
  @IsNumber({}, { message: 'Takaran bahan per porsi harus berupa angka' })
  @Min(0.0001, { message: 'Takaran bahan per porsi harus lebih besar dari 0' })
  quantityPerPortion!: number;
}

export class CreateRecipeDto {
  @ApiProperty({ example: 'R1 Nasi, Lele Goreng, Tumis Bayam, Pisang', description: 'Nama resep baku' })
  @IsString()
  @IsNotEmpty({ message: 'Nama resep wajib diisi' })
  name!: string;

  @ApiPropertyOptional({ description: 'Deskripsi menu dan metode penyajian' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [RecipeItemDto],
    description: 'Rincian bahan komoditas per porsi (kg)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  items?: RecipeItemDto[];
}

export class UpdateRecipeDto {
  @ApiPropertyOptional({ description: 'Nama resep baku' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Deskripsi menu' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class SetRecipeItemsDto {
  @ApiProperty({
    type: [RecipeItemDto],
    description: 'Daftar bahan komoditas per porsi (kg)',
  })
  @IsArray({ message: 'Items harus berupa array' })
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  items!: RecipeItemDto[];
}
