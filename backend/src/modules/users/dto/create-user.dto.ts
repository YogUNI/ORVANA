import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Pengawas Mutu Demo', description: 'Nama lengkap pengguna' })
  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap wajib diisi' })
  name!: string;

  @ApiProperty({ example: 'mutu@orvana.test', description: 'Email akun' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @ApiProperty({
    example: 'Demo1234!',
    description: 'Kata sandi minimal 8 karakter dan mengandung minimal 1 angka',
  })
  @IsString()
  @MinLength(8, { message: 'Kata sandi minimal 8 karakter' })
  @Matches(/(?=.*\d)/, { message: 'Kata sandi harus mengandung minimal 1 angka' })
  password!: string;

  @ApiPropertyOptional({ example: '081234567890', description: 'Nomor telepon' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    enum: [Role.ADMIN, Role.QUALITY_INSPECTOR, Role.AUDITOR],
    description: 'Peran akun internal yang dibuat Admin',
  })
  @IsEnum(Role, { message: 'Peran harus ADMIN, QUALITY_INSPECTOR, atau AUDITOR' })
  role!: Role;

  @ApiPropertyOptional({ description: 'ID Wilayah penugasan' })
  @IsOptional()
  @IsString()
  regionId?: string;
}
