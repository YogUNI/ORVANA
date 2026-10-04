import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar notifikasi dan jumlah unread milik pengguna yang login (docs/06 M11)' })
  async getMyNotifications(
    @CurrentUser('sub') userId: string,
    @Query('unread') unread?: boolean,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.notificationsService.getMyNotifications(userId, {
      unread,
      limit,
      page,
    });
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Menandai satu notifikasi sebagai sudah dibaca' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    const data = await this.notificationsService.markAsRead(id, userId);
    return { data };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Menandai seluruh notifikasi pengguna sebagai sudah dibaca' })
  async markAllAsRead(@CurrentUser('sub') userId: string) {
    const data = await this.notificationsService.markAllAsRead(userId);
    return { data };
  }
}
