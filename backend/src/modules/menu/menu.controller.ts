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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { MenuService } from './menu.service';
import { CreateMenuPlanDto, UpdateMenuPlanDto, GenerateDemandDto } from './dto/menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Menu & Demand Planning')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('kitchens/:id/menu-plans')
  @Roles(Role.KITCHEN_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Daftar menu plan dapur dalam rentang tanggal' })
  async getMenuPlans(
    @Param('id') kitchenId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @CurrentUser('sub') userId?: string,
    @CurrentUser('role') userRole?: Role,
  ) {
    return this.menuService.getMenuPlans(kitchenId, from, to, userId, userRole);
  }

  @Post('kitchens/:id/menu-plans')
  @Roles(Role.KITCHEN_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Membuat menu plan harian dapur' })
  async createMenuPlan(
    @Param('id') kitchenId: string,
    @Body() dto: CreateMenuPlanDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.menuService.createMenuPlan(kitchenId, dto, userId, userRole);
  }

  @Patch('menu-plans/:id')
  @Roles(Role.KITCHEN_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Memperbarui menu plan selagi belum ada permintaan OPEN' })
  async updateMenuPlan(
    @Param('id') id: string,
    @Body() dto: UpdateMenuPlanDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.menuService.updateMenuPlan(id, dto, userId, userRole);
  }

  @Delete('menu-plans/:id')
  @Roles(Role.KITCHEN_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Menghapus menu plan harian' })
  async deleteMenuPlan(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.menuService.deleteMenuPlan(id, userId, userRole);
  }

  @Post('kitchens/:id/demand/generate')
  @Roles(Role.KITCHEN_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Kalkulasi otomatis & pembuatan draf kebutuhan bahan (DemandPlanner)' })
  async generateDemand(
    @Param('id') kitchenId: string,
    @Body() dto: GenerateDemandDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.menuService.generateDemand(kitchenId, dto, userId, userRole);
  }
}
