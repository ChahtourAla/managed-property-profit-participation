import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { ConfirmFundingDto } from './dto/confirm-funding.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @ApiOperation({
    summary: 'Subscribe to an instrument',
    description:
      'Role required: INVESTOR. Creates an investor subscription. The investor party is taken from the JWT user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only INVESTOR can subscribe',
  })
  @ApiResponse({
    status: 404,
    description: 'Instrument or ApprovedInvestor contract not found',
  })
  @Roles(UserRole.INVESTOR)
  @Post()
  createSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.createSubscription(user, dto);
  }

  @ApiOperation({
    summary: 'List subscriptions',
    description:
      'Returns InvestorSubscription contracts visible to the authenticated user. Normal users read only their own party view.',
  })
  @ApiQuery({
    name: 'party',
    required: false,
    example: 'Easycoin::1220abc...',
    description:
      'Optional reader party. Only ADMIN and EASYCOIN are allowed to use this parameter.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscriptions returned successfully',
  })
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

  @ApiOperation({
    summary: 'List funding confirmations',
    description:
      'Returns FundingConfirmation contracts visible to the authenticated user.',
  })
  @ApiQuery({
    name: 'party',
    required: false,
    example: 'Easycoin::1220abc...',
    description:
      'Optional reader party. Only ADMIN and EASYCOIN are allowed to use this parameter.',
  })
  @ApiResponse({
    status: 200,
    description: 'Funding confirmations returned successfully',
  })
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

  @ApiOperation({
    summary: 'Confirm investor funding',
    description:
      'Role required: PAYMENT_VERIFIER. Confirms payment for an investor subscription and creates the investor holding.',
  })
  @ApiParam({
    name: 'subscriptionCid',
    example: '00f7c1...',
    description: 'Daml contract ID of the InvestorSubscription contract',
  })
  @ApiResponse({
    status: 201,
    description: 'Funding confirmed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only PAYMENT_VERIFIER can confirm funding',
  })
  @ApiResponse({
    status: 404,
    description: 'InvestorSubscription or TokenSupply not found',
  })
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
