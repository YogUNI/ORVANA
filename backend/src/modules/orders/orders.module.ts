import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderSchedulerService } from './order-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { LedgerModule } from '../ledger/ledger.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [PrismaModule, AuditModule, LedgerModule, MatchingModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderSchedulerService],
  exports: [OrdersService, OrderSchedulerService],
})
export class OrdersModule {}
