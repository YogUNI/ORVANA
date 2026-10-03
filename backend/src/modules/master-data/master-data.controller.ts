import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role, CommodityCategory } from '@prisma/client';
import { Request } from 'express';
import { MasterDataService } from './master-data.service';
import { CreateCommodityDto, UpdateCommodityDto } from './dto/commodity.dto';
import { SetQualityStandardDto } from './dto/quality-standard.dto';
import { CreateRecipeDto, UpdateRecipeDto, SetRecipeItemsDto } from './dto/recipe.dto';
import { CreatePriceReferenceDto } from './dto/price-reference.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Data')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  // 1. Wilayah
  @Get('regions')
  @ApiOperation({ summary: 'Daftar semua wilayah' })
  async getRegions() {
    return this.masterDataService.getRegions();
  }

  // 2. Komoditas
  @Get('commodities')
  @ApiOperation({ summary: 'Daftar semua komoditas pangan' })
  async getCommodities(
    @Query('category') category?: CommodityCategory,
    @Query('q') q?: string,
  ) {
    return this.masterDataService.getCommodities(category, q);
  }

  @Get('commodities/:id')
  @ApiOperation({ summary: 'Detail satu komoditas' })
  async getCommodityById(@Param('id') id: string) {
    return this.masterDataService.getCommodityById(id);
  }

  @Post('commodities')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Menambah komoditas baru (Khusus ADMIN)' })
  async createCommodity(
    @Body() dto: CreateCommodityDto,
    @CurrentUser('sub') adminId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.masterDataService.createCommodity(dto, adminId, ipAddress);
  }

  @Patch('commodities/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Memperbarui data komoditas (Khusus ADMIN)' })
  async updateCommodity(
    @Param('id') id: string,
    @Body() dto: UpdateCommodityDto,
    @CurrentUser('sub') adminId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.masterDataService.updateCommodity(id, dto, adminId, ipAddress);
  }

  // 3. Standar Mutu
  @Get('commodities/:id/quality-standard')
  @ApiOperation({ summary: 'Ambil standar mutu komoditas' })
  async getQualityStandard(@Param('id') commodityId: string) {
    return this.masterDataService.getQualityStandard(commodityId);
  }

  @Put('commodities/:id/quality-standard')
  @Roles(Role.ADMIN, Role.QUALITY_INSPECTOR)
  @ApiOperation({ summary: 'Menetapkan standar mutu komoditas (ADMIN / QUALITY_INSPECTOR)' })
  async setQualityStandard(
    @Param('id') commodityId: string,
    @Body() dto: SetQualityStandardDto,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.masterDataService.setQualityStandard(commodityId, dto, userId, ipAddress);
  }

  // 4. Resep Baku
  @Get('recipes')
  @ApiOperation({ summary: 'Daftar semua resep baku dapur' })
  async getRecipes() {
    return this.masterDataService.getRecipes();
  }

  @Get('recipes/:id')
  @ApiOperation({ summary: 'Detail resep dan bahan baku' })
  async getRecipeById(@Param('id') id: string) {
    return this.masterDataService.getRecipeById(id);
  }

  @Post('recipes')
  @Roles(Role.ADMIN, Role.KITCHEN_MANAGER)
  @ApiOperation({ summary: 'Membuat resep baru (ADMIN / KITCHEN_MANAGER)' })
  async createRecipe(
    @Body() dto: CreateRecipeDto,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.masterDataService.createRecipe(dto, userId, ipAddress);
  }

  @Patch('recipes/:id')
  @Roles(Role.ADMIN, Role.KITCHEN_MANAGER)
  @ApiOperation({ summary: 'Memperbarui nama/deskripsi resep' })
  async updateRecipe(
    @Param('id') id: string,
    @Body() dto: UpdateRecipeDto,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.masterDataService.updateRecipe(id, dto, userId, ipAddress);
  }

  @Put('recipes/:id/items')
  @Roles(Role.ADMIN, Role.KITCHEN_MANAGER)
  @ApiOperation({ summary: 'Menetapkan bahan per porsi (kg) resep baku' })
  async setRecipeItems(
    @Param('id') id: string,
    @Body() dto: SetRecipeItemsDto,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.masterDataService.setRecipeItems(id, dto, userId, ipAddress);
  }

  // 5. Harga Acuan
  @Get('price-references')
  @ApiOperation({ summary: 'Daftar harga acuan wilayah' })
  async getPriceReferences(
    @Query('commodityId') commodityId?: string,
    @Query('regionId') regionId?: string,
  ) {
    return this.masterDataService.getPriceReferences(commodityId, regionId);
  }

  @Post('price-references')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Menetapkan harga acuan baru (Khusus ADMIN)' })
  async createPriceReference(
    @Body() dto: CreatePriceReferenceDto,
    @CurrentUser('sub') adminId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.masterDataService.createPriceReference(dto, adminId, ipAddress);
  }
}
