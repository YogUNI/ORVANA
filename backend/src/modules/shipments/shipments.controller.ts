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
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto, UpdateShipmentStatusDto } from './dto/shipment.dto';
import { ShipmentStatus, Role } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Shipments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get('orders/available-for-shipment')
  @Roles(Role.COORDINATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Daftar pesanan ACCEPTED yang siap dikonsolidasi per dapur dan tanggal' })
  async getAvailableOrders(@CurrentUser() user: JwtPayload) {
    const data = await this.shipmentsService.getAvailableOrdersForShipment(user);
    return { data };
  }

  @Post('shipments')
  @Roles(Role.COORDINATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Membuat rencana pengiriman baru dari pesanan terpilih (satu dapur)' })
  async createShipment(
    @Body() dto: CreateShipmentDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.shipmentsService.createShipment(dto, user, req.ip);
    return result;
  }

  @Get('shipments')
  @Roles(Role.COORDINATOR, Role.ADMIN, Role.KITCHEN_MANAGER)
  @ApiOperation({ summary: 'Daftar seluruh pengiriman dengan scoping peran' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: ShipmentStatus,
    @Query('kitchenId') kitchenId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.shipmentsService.findAll(user, {
      status,
      kitchenId,
      page,
      limit,
    });
  }

  @Get('shipments/:id')
  @Roles(Role.COORDINATOR, Role.ADMIN, Role.KITCHEN_MANAGER)
  @ApiOperation({ summary: 'Detail pengiriman beserta rute penjemputan dan pesanan' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const data = await this.shipmentsService.findById(id, user);
    return { data };
  }

  @Patch('shipments/:id/status')
  @Roles(Role.COORDINATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Memperbarui status pengiriman (PICKING_UP, IN_TRANSIT, ARRIVED, CANCELLED)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.shipmentsService.updateStatus(id, dto, user, req.ip);
    return result;
  }
}
