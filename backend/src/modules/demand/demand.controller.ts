import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { DemandService } from './demand.service';
import { UpdateDemandRequestDto, FilterDemandRequestDto, CancelDemandDto } from './dto/demand.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Demand Requests')
@Controller('demand-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DemandController {
  constructor(private readonly demandService: DemandService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar permintaan bahan dapur (scoped per peran)' })
  async getDemandRequests(
    @Query() filter: FilterDemandRequestDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.demandService.getDemandRequests(filter, userId, userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail satu permintaan bahan beserta order terkait' })
  async getDemandRequestById(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.demandService.getDemandRequestById(id, userId, userRole);
  }

  @Patch(':id')
  @Roles(Role.KITCHEN_MANAGER)
  @ApiOperation({ summary: 'Memperbarui kuantitas/harga permintaan (DRAFT atau OPEN tanpa order)' })
  async updateDemandRequest(
    @Param('id') id: string,
    @Body() dto: UpdateDemandRequestDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.demandService.updateDemandRequest(id, dto, userId, userRole, ipAddress);
  }

  @Post(':id/publish')
  @Roles(Role.KITCHEN_MANAGER)
  @ApiOperation({ summary: 'Menerbitkan permintaan DRAFT -> OPEN (validasi PRICE_BELOW_FLOOR & H+1)' })
  async publishDemandRequest(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.demandService.publishDemandRequest(id, userId, userRole, ipAddress);
  }

  @Post(':id/cancel')
  @Roles(Role.KITCHEN_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Membatalkan permintaan kebutuhan (melepas reservasi order aktif)' })
  async cancelDemandRequest(
    @Param('id') id: string,
    @Body() dto: CancelDemandDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.demandService.cancelDemandRequest(id, dto, userId, userRole, ipAddress);
  }

  @Post('parse-text')
  @Roles(Role.KITCHEN_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Mengurai teks kebutuhan bahan dapur via AI NLP microservice' })
  async parseDemandText(@Body('text') text: string) {
    return this.demandService.parseDemandText(text);
  }
}
