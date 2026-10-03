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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Supply Offers')
@Controller('supply-offers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SupplyController {
  constructor(private readonly supplyService: SupplyService) {}

  @Get()
  @Roles(Role.SUPPLIER)
  @ApiOperation({ summary: 'Daftar penawaran stok milik pemasok yang login' })
  async getMyOffers(
    @Query() filter: FilterSupplyOfferDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.supplyService.getMyOffers(filter, userId);
  }

  @Get('available')
  @Roles(Role.KITCHEN_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Pratinjau stok pangan aktif di wilayah untuk dapur & admin' })
  async getAvailableOffers(
    @CurrentUser('regionId') regionId: string,
    @Query('commodityId') commodityId?: string,
  ) {
    return this.supplyService.getAvailableOffersInRegion(regionId, commodityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail satu penawaran stok pasokan' })
  async getOfferById(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.supplyService.getOfferById(id, userId, userRole);
  }

  @Post()
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

  @Patch(':id')
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

  @Delete(':id')
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
}
