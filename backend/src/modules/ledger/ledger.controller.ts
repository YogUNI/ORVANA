import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { LedgerService } from './ledger.service';
import { LedgerStage, Role } from '@prisma/client';

@ApiTags('Ledger')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  @Roles(Role.ADMIN, Role.AUDITOR, Role.KITCHEN_MANAGER, Role.SUPPLIER)
  @ApiOperation({ summary: 'Melihat riwayat mutasi buku besar bertahap (scoping peran)' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('orderId') orderId?: string,
    @Query('stage') stage?: LedgerStage,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.ledgerService.findAll(user, {
      orderId,
      stage,
      page,
      limit,
    });
    return result;
  }

  @Get('summary/:orderId')
  @Roles(Role.ADMIN, Role.AUDITOR, Role.KITCHEN_MANAGER, Role.SUPPLIER)
  @ApiOperation({ summary: 'Melihat ringkasan saldo pencadangan, pelepasan, dan pembatalan pesanan' })
  async getSummary(@Param('orderId') orderId: string) {
    const summary = await this.ledgerService.getSummary(orderId);
    return { data: summary };
  }
}
