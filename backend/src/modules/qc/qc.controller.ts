import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { QcService } from './qc.service';
import { ReceiveOrderDto, SubmitQualityCheckDto } from './dto/qc.dto';
import { Role } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Quality Control & Receiving')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class QcController {
  constructor(private readonly qcService: QcService) {}

  @Post('orders/:id/receive')
  @Roles(Role.KITCHEN_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Pengelola Dapur mencatat serah terima barang (IN_TRANSIT -> RECEIVED)' })
  async receiveOrder(
    @Param('id') orderId: string,
    @Body() dto: ReceiveOrderDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.qcService.receiveOrder(orderId, dto, user, req.ip);
    return result;
  }

  @Get('quality-queue')
  @Roles(Role.QUALITY_INSPECTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Antrean batch berstatus RECEIVED yang menunggu inspeksi mutu' })
  async getQualityQueue(@CurrentUser() user: JwtPayload) {
    const data = await this.qcService.getQualityQueue(user);
    return { data };
  }

  @Get('batches/:id')
  @Roles(Role.QUALITY_INSPECTOR, Role.ADMIN, Role.KITCHEN_MANAGER, Role.SUPPLIER, Role.AUDITOR)
  @ApiOperation({ summary: 'Detail satu batch beserta riwayat uji kontrol mutu' })
  async getBatchById(@Param('id') id: string) {
    const data = await this.qcService.getBatchById(id);
    return { data };
  }

  @Post('batches/:id/quality-checks')
  @Roles(Role.QUALITY_INSPECTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Pengawas Mutu mengirimkan hasil inspeksi QC (memicu RELEASE/VOID dan pembaruan skor)' })
  async submitQualityCheck(
    @Param('id') batchId: string,
    @Body() dto: SubmitQualityCheckDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.qcService.submitQualityCheck(batchId, dto, user, req.ip);
    return result;
  }
}
