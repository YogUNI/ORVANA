import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@orvana.test', description: 'Email akun' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @ApiProperty({ example: 'Demo1234!', description: 'Kata sandi akun' })
  @IsString()
  @IsNotEmpty({ message: 'Kata sandi wajib diisi' })
  password!: string;
}
