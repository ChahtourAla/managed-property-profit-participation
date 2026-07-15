import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
import { HoldingsService } from './holdings.service';

@ApiTags('Holdings')
@ApiBearerAuth()
@Controller('holdings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HoldingsController {
  constructor(private readonly holdingsService: HoldingsService) {}

  @ApiOperation({
    summary: 'List active holdings',
    description:
      'Returns active ProfitParticipationHolding contracts visible to the authenticated user.',
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
    description: 'Holdings returned successfully',
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
  getHoldings(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.holdingsService.getHoldings(user, party);
  }

  @ApiOperation({
    summary: 'List holdings by holder',
    description:
      'Returns holdings where the holder field matches the provided Daml party. Normal users cannot read another holder.',
  })
  @ApiParam({
    name: 'holder',
    example: 'Investor1::1220abc...',
    description: 'Daml party ID of the holding owner',
  })
  @ApiQuery({
    name: 'reader',
    required: false,
    example: 'Easycoin::1220abc...',
    description:
      'Optional reader party. Only privileged roles can use this parameter.',
  })
  @ApiResponse({
    status: 200,
    description: 'Holdings by holder returned successfully',
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
  @Get('party/:holder')
  getHoldingsByHolder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('holder') holder: string,
    @Query('reader') reader?: string,
  ) {
    return this.holdingsService.getHoldingsByHolder(user, holder, reader);
  }

  @ApiOperation({
    summary: 'List holdings by instrument ID',
    description:
      'Returns active holdings linked to the provided business instrument ID.',
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
    description: 'Holdings by instrument returned successfully',
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

  @ApiOperation({
    summary: 'Get holding by Daml contract ID',
    description:
      'Returns one ProfitParticipationHolding by its Daml contract ID if visible to the authenticated user.',
  })
  @ApiParam({
    name: 'holdingCid',
    example: '00f7c1...',
    description: 'Daml contract ID of the ProfitParticipationHolding',
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
    description: 'Holding returned successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Holding not found',
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
  @Get('cid/:holdingCid')
  getHoldingByCid(
    @CurrentUser() user: AuthenticatedUser,
    @Param('holdingCid') holdingCid: string,
    @Query('party') party?: string,
  ) {
    return this.holdingsService.getHoldingByCid(user, holdingCid, party);
  }
}
