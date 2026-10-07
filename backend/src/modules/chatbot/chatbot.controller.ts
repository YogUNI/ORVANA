import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ChatbotService, ChatbotResponse } from './chatbot.service';
import { ChatbotQueryDto } from './dto/chatbot-query.dto';

@ApiTags('Chatbot AI Assistant')
@Controller('public/chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // Maksimal 20 kueri per menit per IP untuk melindungi kuota API
  @ApiOperation({ summary: 'Kueri cerdas percakapan AI interaktif (Gemini-powered RAG)' })
  @ApiResponse({ status: 200, description: 'Balasan AI cerdas dan natural berhasil diperoleh' })
  async query(@Body() dto: ChatbotQueryDto): Promise<{ data: ChatbotResponse }> {
    const data = await this.chatbotService.processQuery(dto.message, dto.history);
    return { data };
  }
}
