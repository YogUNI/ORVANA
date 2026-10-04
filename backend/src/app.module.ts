import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SettingsModule } from './modules/settings/settings.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { MenuModule } from './modules/menu/menu.module';
import { DemandModule } from './modules/demand/demand.module';
import { SupplyModule } from './modules/supply/supply.module';
import { MatchingModule } from './modules/matching/matching.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 detik default
        limit: 100, // 100 request default
      },
    ]),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    SettingsModule,
    MasterDataModule,
    MenuModule,
    DemandModule,
    SupplyModule,
    MatchingModule,
    LedgerModule,
    OrdersModule,
    ShipmentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
