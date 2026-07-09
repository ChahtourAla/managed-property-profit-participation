import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { ConfirmRewardPaymentDto } from './dto/confirm-reward-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('rewards')
  getRewardRecords(@Query('party') party?: string) {
    return this.paymentsService.getRewardRecords(party);
  }

  @Get('reward-confirmations')
  getRewardPaymentConfirmations(@Query('party') party?: string) {
    return this.paymentsService.getRewardPaymentConfirmations(party);
  }

  @Post('rewards/:rewardCid/confirm')
  confirmRewardPayment(
    @Param('rewardCid') rewardCid: string,
    @Body() dto: ConfirmRewardPaymentDto,
  ) {
    return this.paymentsService.confirmRewardPayment(rewardCid, dto);
  }
}
