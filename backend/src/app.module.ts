import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DamlModule } from './daml/daml.module';
import { ContractsModule } from './contracts/contracts.module';
import { InvestorsModule } from './investors/investors.module';
import { InstrumentsModule } from './instruments/instruments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { HoldingsModule } from './holdings/holdings.module';
import { ReportsModule } from './reports/reports.module';
import { SettlementsModule } from './settlements/settlements.module';
import { PaymentsModule } from './payments/payments.module';
import { RedemptionsModule } from './redemptions/redemptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DamlModule,
    ContractsModule,
    InvestorsModule,
    InstrumentsModule,
    SubscriptionsModule,
    HoldingsModule,
    ReportsModule,
    SettlementsModule,
    PaymentsModule,
    RedemptionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
