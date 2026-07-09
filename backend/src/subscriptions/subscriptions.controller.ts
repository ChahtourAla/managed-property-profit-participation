import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ConfirmFundingDto } from './dto/confirm-funding.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  createSubscription(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createSubscription(dto);
  }

  @Get()
  getSubscriptions(@Query('party') party?: string) {
    return this.subscriptionsService.getSubscriptions(party);
  }

  @Get('funding-confirmations')
  getFundingConfirmations(@Query('party') party?: string) {
    return this.subscriptionsService.getFundingConfirmations(party);
  }

  @Post(':subscriptionCid/confirm-funding')
  confirmFunding(
    @Param('subscriptionCid') subscriptionCid: string,
    @Body() dto: ConfirmFundingDto,
  ) {
    return this.subscriptionsService.confirmFunding(subscriptionCid, dto);
  }
}
