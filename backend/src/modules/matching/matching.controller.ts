import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Matching & Allocation')
@Controller('demand-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get(':id/candidates')
  @Roles(Role.KITCHEN_MANAGER, Role.ADMIN)
  @ApiOperation({
    summary: 'Pratinjau kandidat pasokan dan rincian skor kecocokan tanpa membuat order',
  })
  async getCandidates(@Param('id') demandId: string) {
    return this.matchingService.findCandidates(demandId);
  }

  @Post(':id/match')
  @Roles(Role.KITCHEN_MANAGER, Role.ADMIN)
  @ApiOperation({
    summary: 'Menjalankan algoritma alokasi greedy dengan batas cap 60% per pemasok',
  })
  async matchAndAllocate(
    @Param('id') demandId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.matchingService.matchAndAllocate(
      demandId,
      userId,
      userRole,
      undefined,
      ipAddress,
    );
  }
}
