import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan seluruh pengaturan sistem (Khusus ADMIN)' })
  @ApiResponse({ status: 200, description: 'Pengaturan sistem berhasil diambil' })
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Put()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Memperbarui satu konfigurasi sistem (Khusus ADMIN)' })
  @ApiResponse({ status: 200, description: 'Pengaturan berhasil diperbarui' })
  @ApiResponse({ status: 400, description: 'Validasi bobot atau format gagal' })
  async updateSetting(
    @Body() dto: UpdateSettingDto,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.settingsService.updateSetting(dto, userId, ipAddress);
  }
}
