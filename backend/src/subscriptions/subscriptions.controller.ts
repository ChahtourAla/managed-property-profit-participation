import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { ConfirmFundingDto } from './dto/confirm-funding.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Roles(UserRole.INVESTOR)
  @Post()
  createSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.createSubscription(user, dto);
  }

  @Roles(
    UserRole.ADMIN,
    UserRole.EASYCOIN,
    UserRole.OWNER,
    UserRole.INVESTOR,
    UserRole.AUDITOR,
    UserRole.LEGAL_ADMIN,
    UserRole.PAYMENT_VERIFIER,
  )
  @Get()
  getSubscriptions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.subscriptionsService.getSubscriptions(user, party);
  }

  @Roles(
    UserRole.ADMIN,
    UserRole.EASYCOIN,
    UserRole.OWNER,
    UserRole.INVESTOR,
    UserRole.AUDITOR,
    UserRole.LEGAL_ADMIN,
    UserRole.PAYMENT_VERIFIER,
  )
  @Get('funding-confirmations')
  getFundingConfirmations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.subscriptionsService.getFundingConfirmations(user, party);
  }

  @Roles(UserRole.PAYMENT_VERIFIER)
  @Post(':subscriptionCid/confirm-funding')
  confirmFunding(
    @CurrentUser() user: AuthenticatedUser,
    @Param('subscriptionCid') subscriptionCid: string,
    @Body() dto: ConfirmFundingDto,
  ) {
    return this.subscriptionsService.confirmFunding(user, subscriptionCid, dto);
  }
}
