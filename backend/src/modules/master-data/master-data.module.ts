import { Module } from '@nestjs/common';
import { MasterDataService } from './master-data.service';
import { MasterDataController } from './master-data.controller';
import { MarketPriceSyncService } from './market-price-sync.service';

@Module({
  controllers: [MasterDataController],
  providers: [MasterDataService, MarketPriceSyncService],
  exports: [MasterDataService, MarketPriceSyncService],
})
export class MasterDataModule {}
