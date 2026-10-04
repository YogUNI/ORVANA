import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { OrdersService } from '../orders/orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { Response } from 'express';

@ApiTags('Dashboard & Impact')
@Controller()
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get('reports/orders.csv')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Ekspor daftar pesanan dalam format CSV resmi (docs/06 M10 P1)' })
  async exportOrdersCsvReport(
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

  @Get('public/impact-summary')
  @ApiOperation({ summary: 'Ringkasan dampak agregat publik untuk landing page (M9)' })
  @ApiResponse({ status: 200, description: 'Ringkasan dampak publik' })
  async getPublicImpactSummary() {
    const data = await this.dashboardService.getPublicImpactSummary();
    return { data };
  }

  @Get('dashboard/impact')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.AUDITOR, Role.KITCHEN_MANAGER)
  @ApiOperation({ summary: 'Melihat 9 metrik dampak sistem secara komprehensif (docs/04 bagian 10)' })
  @ApiResponse({ status: 200, description: 'Metrik dampak sistem' })
  async getImpactMetrics(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('regionId') regionId?: string,
  ) {
    const data = await this.dashboardService.getImpactMetrics({
      from,
      to,
      regionId,
    });
    return { data };
  }

  @Get('dashboard/kitchen')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.KITCHEN_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Melihat dashboard operasional pengelola dapur (M10 P1)' })
  @ApiResponse({ status: 200, description: 'Data dashboard dapur' })
  async getKitchenDashboard(@CurrentUser() user: JwtPayload) {
    const data = await this.dashboardService.getKitchenDashboard(user);
    return { data };
  }

  @Get('dashboard/supplier')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPPLIER, Role.ADMIN)
  @ApiOperation({ summary: 'Melihat dashboard performa dan hak keuangan produsen lokal (M10 P1)' })
  @ApiResponse({ status: 200, description: 'Data dashboard produsen' })
  async getSupplierDashboard(@CurrentUser() user: JwtPayload) {
    const data = await this.dashboardService.getSupplierDashboard(user);
    return { data };
  }

  @Get('dashboard/coordinator')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COORDINATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Melihat dashboard logistik dan order siap jemput koordinator (M10 P1)' })
  @ApiResponse({ status: 200, description: 'Data dashboard koordinator' })
  async getCoordinatorDashboard(@CurrentUser() user: JwtPayload) {
    const data = await this.dashboardService.getCoordinatorDashboard(user);
    return { data };
  }
}
