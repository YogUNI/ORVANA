import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TraceService } from './trace.service';

@ApiTags('Public Trace')
@Controller('public')
export class TraceController {
  constructor(private readonly traceService: TraceService) {}

  @Get('trace/:batchCode')
  @ApiOperation({ summary: 'Melihat jejak penelusuran batch publik tanpa login (M9)' })
  @ApiResponse({ status: 200, description: 'Detail penelusuran batch berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Kode batch tidak ditemukan' })
  async getPublicTrace(@Param('batchCode') batchCode: string) {
    const data = await this.traceService.getPublicTrace(batchCode);
    return { data };
  }
}
