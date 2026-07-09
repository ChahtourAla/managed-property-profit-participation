import { Module } from '@nestjs/common';
import { DamlClientService } from './daml-client/daml-client.service';

@Module({
  providers: [DamlClientService],
  exports: [DamlClientService],
})
export class DamlModule {}
