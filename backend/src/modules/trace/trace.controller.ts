import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { TraceService } from './trace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Trace & Batches (M9)')
@Controller()
export class TraceController {
  constructor(private readonly traceService: TraceService) {}

  @Get('public/trace/:batchCode')
  @ApiOperation({ summary: 'Melihat jejak penelusuran batch publik tanpa login (M9)' })
  @ApiResponse({ status: 200, description: 'Detail penelusuran batch berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Kode batch tidak ditemukan' })
  async getPublicTrace(@Param('batchCode') batchCode: string) {
    const data = await this.traceService.getPublicTrace(batchCode);
    return { data };
  }

  @Get('batches/:id/qr.png')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.KITCHEN_MANAGER, Role.SUPPLIER, Role.QUALITY_INSPECTOR, Role.COORDINATOR, Role.AUDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengunduh gambar QR code penelusuran batch (M9 P1)' })
  @ApiResponse({ status: 200, description: 'Gambar QR code berhasil di-generate (image/png)' })
  @ApiResponse({ status: 404, description: 'Batch tidak ditemukan' })
  async getBatchQr(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const { buffer, batchCode } = await this.traceService.generateQrCode(id, user);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="qr-batch-${batchCode}.png"`);
    res.send(buffer);
  }

  @Get('batches/:id/certificate.pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.KITCHEN_MANAGER, Role.SUPPLIER, Role.QUALITY_INSPECTOR, Role.COORDINATOR, Role.AUDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengunduh sertifikat mutu dan penelusuran batch dalam format PDF (M9 P1)' })
  @ApiResponse({ status: 200, description: 'Sertifikat PDF berhasil di-generate (application/pdf)' })
  @ApiResponse({ status: 404, description: 'Batch tidak ditemukan' })
  async getBatchCertificate(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.traceService.generateCertificatePdf(id, user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('public/trace/:batchCode/qr.png')
  @ApiOperation({ summary: 'Melihat gambar QR code penelusuran batch publik (M9 P1)' })
  @ApiResponse({ status: 200, description: 'Gambar QR code (image/png)' })
  async getPublicBatchQr(
    @Param('batchCode') batchCode: string,
    @Res() res: Response,
  ) {
    // Publik anonymous user untuk scoping
    const publicUser: JwtPayload = {
      sub: 'public',
      email: 'public@orvana.test',
      role: Role.AUDITOR, // Auditor memiliki akses melihat semua batch terdaftar
      status: 'ACTIVE' as any,
      regionId: '',
      tokenVersion: 0,
    };
    const { buffer } = await this.traceService.generateQrCode(batchCode, publicUser);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="qr-batch-${batchCode}.png"`);
    res.send(buffer);
  }

  @Get('public/trace/:batchCode/certificate.pdf')
  @ApiOperation({ summary: 'Mengunduh sertifikat mutu dan penelusuran batch publik dalam format PDF (M9 P1)' })
  @ApiResponse({ status: 200, description: 'Sertifikat PDF (application/pdf)' })
  async getPublicBatchCertificate(
    @Param('batchCode') batchCode: string,
    @Res() res: Response,
  ) {
    const publicUser: JwtPayload = {
      sub: 'public',
      email: 'public@orvana.test',
      role: Role.AUDITOR,
      status: 'ACTIVE' as any,
      regionId: '',
      tokenVersion: 0,
    };
    const { buffer, filename } = await this.traceService.generateCertificatePdf(batchCode, publicUser);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}

