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
import { RedeemAllHoldingsDto } from './dto/redeem-all-holdings.dto';
import { RedeemHoldingDto } from './dto/redeem-holding.dto';
import { RedemptionsService } from './redemptions.service';

@Controller('redemptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RedemptionsController {
  constructor(private readonly redemptionsService: RedemptionsService) {}

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
  getRedemptionRecords(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.redemptionsService.getRedemptionRecords(user, party);
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
  @Get('instrument/:instrumentId')
  getRedemptionRecordsByInstrument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('instrumentId') instrumentId: string,
    @Query('party') party?: string,
  ) {
    return this.redemptionsService.getRedemptionRecordsByInstrument(
      user,
      instrumentId,
      party,
    );
  }

  @Roles(UserRole.EASYCOIN)
  @Post(':closedCid/redeem')
  redeemHolding(
    @CurrentUser() user: AuthenticatedUser,
    @Param('closedCid') closedCid: string,
    @Body() dto: RedeemHoldingDto,
  ) {
    return this.redemptionsService.redeemHolding(user, closedCid, dto);
  }

  @Roles(UserRole.EASYCOIN)
  @Post(':closedCid/redeem-all')
  redeemAllHoldings(
    @CurrentUser() user: AuthenticatedUser,
    @Param('closedCid') closedCid: string,
    @Body() dto: RedeemAllHoldingsDto,
  ) {
    return this.redemptionsService.redeemAllHoldings(user, closedCid, dto);
  }
}
