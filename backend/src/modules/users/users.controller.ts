import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar semua pengguna dengan filter dan paginasi (Khusus ADMIN)' })
  @ApiResponse({ status: 200, description: 'Daftar pengguna berhasil diambil' })
  async findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail satu pengguna (Khusus ADMIN)' })
  @ApiResponse({ status: 200, description: 'Detail pengguna berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Pengguna tidak ditemukan' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Membuat akun internal: ADMIN, QUALITY_INSPECTOR, AUDITOR (Khusus ADMIN)' })
  @ApiResponse({ status: 201, description: 'Akun internal berhasil dibuat dengan status ACTIVE' })
  @ApiResponse({ status: 409, description: 'Email sudah digunakan' })
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser('sub') adminId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.usersService.createUser(dto, adminId, ipAddress);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Ubah status akun: ACTIVE (verifikasi) atau SUSPENDED (penangguhan)' })
  @ApiResponse({ status: 200, description: 'Status pengguna berhasil diperbarui' })
  @ApiResponse({ status: 404, description: 'Pengguna tidak ditemukan' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser('sub') adminId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.usersService.updateStatus(id, dto, adminId, ipAddress);
  }
}
