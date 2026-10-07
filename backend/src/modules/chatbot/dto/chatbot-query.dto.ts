import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatbotQueryDto {
  @ApiProperty({ description: 'Pesan pertanyaan dari pengguna', example: 'Apa itu aturan kuota 60% di ORVANA?' })
  @IsString()
  @IsNotEmpty({ message: 'Pesan tidak boleh kosong' })
  @MaxLength(1000, { message: 'Pesan maksimal 1000 karakter' })
  message!: string;

  @ApiProperty({ description: 'Riwayat percakapan sebelumnya jika ada', required: false })
  @IsOptional()
  history?: Array<{
    role: 'user' | 'model';
    text: string;
  }>;
}
