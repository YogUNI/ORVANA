import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Pendaftaran akun mandiri (KITCHEN_MANAGER, SUPPLIER, COORDINATOR)' })
  @ApiResponse({ status: 201, description: 'Registrasi berhasil, akun berstatus PENDING' })
  @ApiResponse({ status: 403, description: 'Peran tidak diizinkan untuk registrasi publik' })
  @ApiResponse({ status: 409, description: 'Email sudah digunakan' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // Relaksasi limit untuk pengujian pengembangan
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Masuk akun dengan email dan kata sandi' })
  @ApiResponse({ status: 200, description: 'Login berhasil, mengembalikan Access & Refresh token' })
  @ApiResponse({ status: 401, description: 'Kredensial tidak valid atau akun ditangguhkan' })
  @ApiResponse({ status: 429, description: 'Terlalu banyak percobaan login gagal' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotasi refresh token dan penerbitan access token baru' })
  @ApiResponse({ status: 200, description: 'Token berhasil dirotasi' })
  @ApiResponse({ status: 401, description: 'Refresh token tidak valid atau telah dicabut' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Keluar dan mencabut semua refresh token aktif' })
  @ApiResponse({ status: 200, description: 'Berhasil logout' })
  async logout(@CurrentUser('sub') userId: string) {
    return this.authService.logout(userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil profil lengkap pengguna yang sedang aktif' })
  @ApiResponse({ status: 200, description: 'Data profil berhasil diambil' })
  async getMe(@CurrentUser('sub') userId: string) {
    return this.authService.getMe(userId);
  }
}
