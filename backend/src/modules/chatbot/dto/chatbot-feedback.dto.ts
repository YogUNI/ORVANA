import { IsString, IsNotEmpty, IsIn, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatbotFeedbackDto {
  @ApiProperty({ description: 'ID catatan percakapan yang diberi umpan balik', example: 'uuid-123-abc' })
  @IsString()
  @IsNotEmpty({ message: 'chatLogId tidak boleh kosong' })
  chatLogId!: string;

  @ApiProperty({ description: 'Rating umpan balik: 1 untuk thumbs up, -1 untuk thumbs down', example: 1 })
  @IsIn([1, -1], { message: 'rating harus bernilai 1 (membantu) atau -1 (kurang tepat)' })
  rating!: number;

  @ApiProperty({ description: 'Catatan atau masukan opsional dari pengguna', required: false, example: 'Penjelasan kuota 60% sangat jelas dan mudah dipahami.' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Catatan maksimal 500 karakter' })
  note?: string;
}
