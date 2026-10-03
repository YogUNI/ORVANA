import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token yang masih berlaku' })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token wajib disertakan' })
  refreshToken!: string;
}
