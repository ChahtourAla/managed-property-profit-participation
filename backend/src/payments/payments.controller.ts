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
import { ConfirmRewardPaymentDto } from './dto/confirm-reward-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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
