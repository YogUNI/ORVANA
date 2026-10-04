import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { DisputesService } from './disputes.service';
import { DisputeStatus, Role } from '@prisma/client';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { Request } from 'express';

@ApiTags('Disputes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post('orders/:id/disputes')
  @Roles(Role.KITCHEN_MANAGER, Role.SUPPLIER, Role.ADMIN)
  @ApiOperation({
    summary:
      'Pengajuan sengketa oleh Dapur atau Pemasok dalam batas jendela 48 jam pasca-QC (docs/06 M8)',
  })
  async createDispute(
    @Param('id') id: string,
    @Body() dto: CreateDisputeDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const data = await this.disputesService.createDispute(id, dto, user, req.ip);
    return { data };
  }

  @Get('disputes')
  @Roles(Role.ADMIN, Role.KITCHEN_MANAGER, Role.SUPPLIER, Role.AUDITOR)
  @ApiOperation({ summary: 'Daftar sengketa terfilter dengan scoping peran' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: DisputeStatus,
    @Query('orderId') orderId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.disputesService.findAll(user, { status, orderId, page, limit });
  }

  @Get('disputes/:id')
  @Roles(Role.ADMIN, Role.KITCHEN_MANAGER, Role.SUPPLIER, Role.AUDITOR)
  @ApiOperation({ summary: 'Detail sengketa beserta riwayat pesanan dan ledger' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const data = await this.disputesService.findById(id, user);
    return { data };
  }

  @Patch('disputes/:id/review')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin memindahkan sengketa ke status UNDER_REVIEW' })
  async review(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const data = await this.disputesService.reviewDispute(id, user, req.ip);
    return { data };
  }

  @Patch('disputes/:id/resolve')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Admin memutus sengketa (FAVOR_SUPPLIER, FAVOR_KITCHEN, SPLIT) dan mencatat mutasi ADJUSTMENT di ledger',
  })
  async resolve(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const data = await this.disputesService.resolveDispute(id, dto, user, req.ip);
    return { data };
  }
}
