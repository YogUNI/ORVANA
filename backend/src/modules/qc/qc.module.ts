import { Module } from '@nestjs/common';
import { QcService } from './qc.service';
import { QcController } from './qc.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { SettingsModule } from '../settings/settings.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [PrismaModule, AuditModule, SettingsModule, LedgerModule],
  controllers: [QcController],
  providers: [QcService],
  exports: [QcService],
})
export class QcModule {}
