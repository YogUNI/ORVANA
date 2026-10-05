import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { SupplyService } from './supply.service';
import {
  CreateSupplyOfferDto,
  UpdateSupplyOfferDto,
  FilterSupplyOfferDto,
} from './dto/supply-offer.dto';
import {
  CreateHarvestPlanDto,
  UpdateHarvestPlanDto,
} from './dto/harvest-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Supply Offers & Harvest Plans')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SupplyController {
  constructor(private readonly supplyService: SupplyService) {}

  @Get('supply-offers')
  @Roles(Role.SUPPLIER)
  @ApiOperation({ summary: 'Daftar penawaran stok milik pemasok yang login' })
  async getMyOffers(
    @Query() filter: FilterSupplyOfferDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.supplyService.getMyOffers(filter, userId);
  }

  @Get('supply-offers/mutations')
  @Roles(Role.SUPPLIER)
  @ApiOperation({ summary: 'Buku mutasi stok persediaan (Inventory Ledger) pemasok (Pilar 2 - P2.1)' })
  async getStockMutations(@CurrentUser('sub') userId: string) {
    return this.supplyService.getStockMutations(userId);
  }

  @Get('supply-offers/available')
  @Roles(Role.KITCHEN_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Pratinjau stok pangan aktif di wilayah untuk dapur & admin' })
  async getAvailableOffers(
    @CurrentUser('regionId') regionId: string,
    @Query('commodityId') commodityId?: string,
  ) {
    return this.supplyService.getAvailableOffersInRegion(regionId, commodityId);
  }

  @Get('supply-offers/:id')
  @ApiOperation({ summary: 'Detail satu penawaran stok pasokan' })
  async getOfferById(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.supplyService.getOfferById(id, userId, userRole);
  }

  @Post('supply-offers')
  @Roles(Role.SUPPLIER)
  @ApiOperation({ summary: 'Membuat penawaran stok pasokan baru (validasi harga dasar)' })
  async createOffer(
    @Body() dto: CreateSupplyOfferDto,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.supplyService.createOffer(dto, userId, ipAddress);
  }

  @Patch('supply-offers/:id')
  @Roles(Role.SUPPLIER)
  @ApiOperation({ summary: 'Memperbarui stok pasokan (tidak boleh turun di bawah reserved)' })
  async updateOffer(
    @Param('id') id: string,
    @Body() dto: UpdateSupplyOfferDto,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.supplyService.updateOffer(id, dto, userId, ipAddress);
  }

  @Delete('supply-offers/:id')
  @Roles(Role.SUPPLIER)
  @ApiOperation({ summary: 'Membatalkan penawaran stok pasokan (hanya jika reserved = 0)' })
  async cancelOffer(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.supplyService.cancelOffer(id, userId, ipAddress);
  }

  // =========================================================================
  // ENDPOINT RENCANA PANEN (HARVEST PLANS) - docs/06 M3
  // =========================================================================

  @Get('harvest-plans')
  @Roles(Role.SUPPLIER)
  @ApiOperation({ summary: 'Daftar rencana panen milik pemasok yang login' })
  async getMyHarvestPlans(@CurrentUser('sub') userId: string) {
    const data = await this.supplyService.getMyHarvestPlans(userId);
    return { data };
  }

  @Post('harvest-plans')
  @Roles(Role.SUPPLIER)
  @ApiOperation({ summary: 'Membuat rencana panen baru untuk pemasok' })
  async createHarvestPlan(
    @Body() dto: CreateHarvestPlanDto,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const data = await this.supplyService.createHarvestPlan(dto, userId, ipAddress);
    return { data };
  }

  @Patch('harvest-plans/:id')
  @Roles(Role.SUPPLIER)
  @ApiOperation({ summary: 'Memperbarui rencana panen milik pemasok' })
  async updateHarvestPlan(
    @Param('id') id: string,
    @Body() dto: UpdateHarvestPlanDto,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const data = await this.supplyService.updateHarvestPlan(id, dto, userId, ipAddress);
    return { data };
  }

  @Delete('harvest-plans/:id')
  @Roles(Role.SUPPLIER)
  @ApiOperation({ summary: 'Menghapus rencana panen milik pemasok' })
  async deleteHarvestPlan(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const data = await this.supplyService.deleteHarvestPlan(id, userId, ipAddress);
    return { data };
  }

  // =========================================================================
  // ENDPOINT KALENDER PANEN KOLEKTIF & HEATMAP (docs/06 M3)
  // =========================================================================

  @Get('harvest-calendar')
  @Roles(Role.SUPPLIER, Role.ADMIN, Role.KITCHEN_MANAGER, Role.COORDINATOR, Role.AUDITOR)
  @ApiOperation({
    summary:
      'Agregat kalender panen kolektif per komoditas per minggu (demand, supply, ratio, status) untuk heatmap',
  })
  async getHarvestCalendar(
    @Query('regionId') regionId?: string,
    @Query('weeks') weeks?: number,
  ) {
    const data = await this.supplyService.getHarvestCalendar({ regionId, weeks });
    return { data };
  }
}
