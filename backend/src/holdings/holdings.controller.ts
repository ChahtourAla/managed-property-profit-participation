import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { HoldingsService } from './holdings.service';

@Controller('holdings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HoldingsController {
  constructor(private readonly holdingsService: HoldingsService) {}

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
  getHoldings(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.holdingsService.getHoldings(user, party);
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
  @Get('party/:holder')
  getHoldingsByHolder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('holder') holder: string,
    @Query('reader') reader?: string,
  ) {
    return this.holdingsService.getHoldingsByHolder(user, holder, reader);
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
  getHoldingsByInstrument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('instrumentId') instrumentId: string,
    @Query('party') party?: string,
  ) {
    return this.holdingsService.getHoldingsByInstrument(
      user,
      instrumentId,
      party,
    );
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
  @Get('cid/:holdingCid')
  getHoldingByCid(
    @CurrentUser() user: AuthenticatedUser,
    @Param('holdingCid') holdingCid: string,
    @Query('party') party?: string,
  ) {
    return this.holdingsService.getHoldingByCid(user, holdingCid, party);
  }
}
