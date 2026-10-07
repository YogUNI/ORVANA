import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ChatbotService, ChatbotResponse } from './chatbot.service';
import { ChatbotQueryDto } from './dto/chatbot-query.dto';
import { ChatbotFeedbackDto } from './dto/chatbot-feedback.dto';

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
  async query(
    @Body() dto: ChatbotQueryDto,
    @Ip() ipAddress: string,
  ): Promise<{ data: ChatbotResponse }> {
    const data = await this.chatbotService.processQuery(dto.message, dto.history, ipAddress);
    return { data };
  }

  @Post('feedback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kirim umpan balik (👍 / 👎) dari pengguna untuk continuous active learning' })
  @ApiResponse({ status: 200, description: 'Umpan balik berhasil dicatat' })
  async feedback(@Body() dto: ChatbotFeedbackDto) {
    const updated = await this.chatbotService.recordFeedback(dto.chatLogId, dto.rating, dto.note);
    return {
      data: {
        success: true,
        message: 'Terima kasih! Umpan balik Anda membantu AI ORVANA belajar lebih akurat.',
        logId: updated.id,
      },
    };
  }

  @Get('telemetry')
  @ApiOperation({ summary: 'Ambil statistik performa telemetri active learning chatbot' })
  @ApiResponse({ status: 200, description: 'Statistik active learning berhasil diambil' })
  async getTelemetry() {
    const telemetry = await this.chatbotService.getActiveLearningTelemetry();
    return { data: telemetry };
  }
}

