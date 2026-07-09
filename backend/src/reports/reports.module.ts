import { Module } from '@nestjs/common';
import { DamlModule } from '../daml/daml.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [DamlModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
