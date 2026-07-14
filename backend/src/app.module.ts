import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DamlModule } from './daml/daml.module';
import { UsersModule } from './users/users.module';
import { ContractsModule } from './contracts/contracts.module';
import { InvestorsModule } from './investors/investors.module';
import { InstrumentsModule } from './instruments/instruments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { HoldingsModule } from './holdings/holdings.module';
import { ReportsModule } from './reports/reports.module';
import { SettlementsModule } from './settlements/settlements.module';
import { PaymentsModule } from './payments/payments.module';
import { RedemptionsModule } from './redemptions/redemptions.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    DamlModule,
    AuthModule,
    ContractsModule,
    InvestorsModule,
    InstrumentsModule,
    SubscriptionsModule,
    HoldingsModule,
    ReportsModule,
    SettlementsModule,
    PaymentsModule,
    RedemptionsModule,
    UsersModule,
  ],
})
export class AppModule {}
