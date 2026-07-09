import { Module } from '@nestjs/common';
import { DamlModule } from '../daml/daml.module';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

@Module({
  imports: [DamlModule],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}
