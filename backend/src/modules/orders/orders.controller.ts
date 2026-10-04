import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { OrderStatus, Role } from '@prisma/client';
import { RejectOrderDto, CancelOrderDto } from './dto/order-action.dto';
import { CreateSupplierReviewDto } from './dto/supplier-review.dto';
import { Request, Response } from 'express';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.KITCHEN_MANAGER, Role.SUPPLIER, Role.COORDINATOR, Role.AUDITOR)
  @ApiOperation({ summary: 'Daftar pesanan dengan filter dan scoping peran' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: OrderStatus,
    @Query('demandId') demandId?: string,
    @Query('kitchenId') kitchenId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.findAll(user, {
      status,
      demandId,
      kitchenId,
      supplierId,
      page,
      limit,
    });
  }

  @Get('export/csv')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Ekspor daftar pesanan dalam format CSV (docs/06 M10 P1)' })
  async exportOrdersCsv(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Res() res: Response,
  ) {
    const csvData = await this.ordersService.exportOrdersCsv({ from, to });
    const filename = `orvana-orders-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.KITCHEN_MANAGER, Role.SUPPLIER, Role.COORDINATOR, Role.AUDITOR)
  @ApiOperation({ summary: 'Detail pesanan lengkap beserta riwayat ledger dan audit' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const data = await this.ordersService.findById(id, user);
    return { data };
  }

  @Post(':id/accept')
  @Roles(Role.SUPPLIER, Role.ADMIN)
  @ApiOperation({ summary: 'Pemasok menyanggupi/menerima tawaran pesanan (memicu pencadangan HOLD)' })
  async accept(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.ordersService.accept(id, user, req.ip);
    return { data: result };
  }

  @Post(':id/reject')
  @Roles(Role.SUPPLIER, Role.ADMIN)
  @ApiOperation({ summary: 'Pemasok menolak tawaran pesanan (melepas reservasi dan alokasi ulang)' })
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectOrderDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.ordersService.reject(id, dto, user, req.ip);
    return { data: result };
  }

  @Post(':id/cancel')
  @Roles(Role.ADMIN, Role.KITCHEN_MANAGER)
  @ApiOperation({ summary: 'Admin atau Pengelola Dapur membatalkan pesanan' })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.ordersService.cancel(id, dto, user, req.ip);
    return { data: result };
  }

  @Post(':id/reviews')
  @Roles(Role.KITCHEN_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Memberikan rating dan ulasan performa pemasok (docs/06 M10 / T7.7)' })
  async createReview(
    @Param('id') id: string,
    @Body() dto: CreateSupplierReviewDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const result = await this.ordersService.createReview(id, dto, user, req.ip);
    return { data: result };
  }
}
