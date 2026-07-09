import { Module } from '@nestjs/common';
import { DamlModule } from '../daml/daml.module';
import { InvestorsController } from './investors.controller';
import { InvestorsService } from './investors.service';

@Module({
  imports: [DamlModule],
  controllers: [InvestorsController],
  providers: [InvestorsService],
})
export class InvestorsModule {}
