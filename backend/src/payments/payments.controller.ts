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
import { ConfirmRewardPaymentDto } from './dto/confirm-reward-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({
    summary: 'List reward records',
    description:
      'Returns RewardRecord contracts visible to the authenticated user.',
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
    description: 'Reward records returned successfully',
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
  @Get('rewards')
  getRewardRecords(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.paymentsService.getRewardRecords(user, party);
  }

  @ApiOperation({
    summary: 'List reward payment confirmations',
    description:
      'Returns RewardPaymentConfirmation contracts visible to the authenticated user.',
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
    description: 'Reward payment confirmations returned successfully',
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
  @Get('reward-confirmations')
  getRewardPaymentConfirmations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.paymentsService.getRewardPaymentConfirmations(user, party);
  }

  @ApiOperation({
    summary: 'Confirm reward payment',
    description:
      'Role required: PAYMENT_VERIFIER. Confirms that a reward payment was made for a RewardRecord.',
  })
  @ApiParam({
    name: 'rewardCid',
    example: '00f7c1...',
    description: 'Daml contract ID of the RewardRecord contract',
  })
  @ApiResponse({
    status: 201,
    description: 'Reward payment confirmed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only PAYMENT_VERIFIER can confirm reward payments',
  })
  @ApiResponse({
    status: 404,
    description: 'RewardRecord not found',
  })
  @Roles(UserRole.PAYMENT_VERIFIER)
  @Post('rewards/:rewardCid/confirm')
  confirmRewardPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('rewardCid') rewardCid: string,
    @Body() dto: ConfirmRewardPaymentDto,
  ) {
    return this.paymentsService.confirmRewardPayment(user, rewardCid, dto);
  }
}
