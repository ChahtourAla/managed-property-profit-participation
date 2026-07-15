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
import { RedeemAllHoldingsDto } from './dto/redeem-all-holdings.dto';
import { RedeemHoldingDto } from './dto/redeem-holding.dto';
import { RedemptionsService } from './redemptions.service';

@ApiTags('Redemptions')
@ApiBearerAuth()
@Controller('redemptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RedemptionsController {
  constructor(private readonly redemptionsService: RedemptionsService) {}

  @ApiOperation({
    summary: 'List redemption / burn records',
    description:
      'Returns TokenRedemptionBurnRecord contracts visible to the authenticated user.',
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
    description: 'Redemption records returned successfully',
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
  getRedemptionRecords(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.redemptionsService.getRedemptionRecords(user, party);
  }

  @ApiOperation({
    summary: 'List redemption records by instrument ID',
    description:
      'Returns TokenRedemptionBurnRecord contracts linked to a business instrument ID.',
  })
  @ApiParam({
    name: 'instrumentId',
    example: 'INSTR-MPC-001',
    description: 'Business instrument ID',
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
    description: 'Redemption records by instrument returned successfully',
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

  @ApiOperation({
    summary: 'Redeem one holding',
    description:
      'Role required: EASYCOIN. Redeems and burns one active ProfitParticipationHolding after settlement closure.',
  })
  @ApiParam({
    name: 'closedCid',
    example: '00f7c1...',
    description: 'Daml contract ID of the ClosedManagedContract',
  })
  @ApiResponse({
    status: 201,
    description: 'Holding redeemed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only EASYCOIN can redeem holdings',
  })
  @ApiResponse({
    status: 404,
    description: 'ClosedManagedContract or holding not found',
  })
  @Roles(UserRole.EASYCOIN)
  @Post(':closedCid/redeem')
  redeemHolding(
    @CurrentUser() user: AuthenticatedUser,
    @Param('closedCid') closedCid: string,
    @Body() dto: RedeemHoldingDto,
  ) {
    return this.redemptionsService.redeemHolding(user, closedCid, dto);
  }

  @ApiOperation({
    summary: 'Redeem all active holdings',
    description:
      'Role required: EASYCOIN. Redeems and burns all active holdings linked to the closed instrument.',
  })
  @ApiParam({
    name: 'closedCid',
    example: '00f7c1...',
    description: 'Daml contract ID of the ClosedManagedContract',
  })
  @ApiResponse({
    status: 201,
    description: 'All active holdings redeemed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only EASYCOIN can redeem holdings',
  })
  @ApiResponse({
    status: 404,
    description: 'ClosedManagedContract or active holdings not found',
  })
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
