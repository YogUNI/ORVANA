import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class UpdateUserStatusDto {
  @ApiProperty({
    enum: [UserStatus.ACTIVE, UserStatus.SUSPENDED],
    description: 'Status akun baru (ACTIVE untuk verifikasi, SUSPENDED untuk penangguhan)',
  })
  @IsEnum(UserStatus, { message: 'Status harus ACTIVE atau SUSPENDED' })
  @IsNotEmpty({ message: 'Status wajib diisi' })
  status!: UserStatus;

  @ApiPropertyOptional({ description: 'Alasan perubahan status akun' })
  @IsOptional()
  @IsString()
  reason?: string;
}
