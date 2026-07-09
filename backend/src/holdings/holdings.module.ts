import { Module } from '@nestjs/common';
import { DamlModule } from '../daml/daml.module';
import { HoldingsController } from './holdings.controller';
import { HoldingsService } from './holdings.service';

@Module({
  imports: [DamlModule],
  controllers: [HoldingsController],
  providers: [HoldingsService],
})
export class HoldingsModule {}
