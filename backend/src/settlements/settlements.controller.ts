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
import { CloseSettlementDto } from './dto/close-settlement.dto';
import { CreateRewardRecordsDto } from './dto/create-reward-records.dto';
import { SubmitFinalReconciliationDto } from './dto/submit-final-reconciliation.dto';
import { SettlementsService } from './settlements.service';

@ApiTags('Settlements')
@ApiBearerAuth()
@Controller('settlements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @ApiOperation({
    summary: 'Submit final reconciliation',
    description:
      'Role required: EASYCOIN. Submits the final financial reconciliation for an instrument.',
  })
  @ApiResponse({
    status: 201,
    description: 'Final reconciliation submitted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only EASYCOIN can submit final reconciliation',
  })
  @ApiResponse({
    status: 404,
    description: 'TokenizedInstrument not found',
  })
  @Roles(UserRole.EASYCOIN)
  @Post('final')
  submitFinalReconciliation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitFinalReconciliationDto,
  ) {
    return this.settlementsService.submitFinalReconciliation(user, dto);
  }

  @ApiOperation({
    summary: 'List final reconciliations',
    description:
      'Returns FinalReconciliation contracts visible to the authenticated user.',
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
    description: 'Final reconciliations returned successfully',
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
  getSettlements(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.settlementsService.getSettlements(user, party);
  }

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
    return this.settlementsService.getRewardRecords(user, party);
  }

  @ApiOperation({
    summary: 'List closed contracts',
    description:
      'Returns ClosedManagedContract contracts visible to the authenticated user.',
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
    description: 'Closed contracts returned successfully',
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
  @Get('closed')
  getClosedContracts(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.settlementsService.getClosedContracts(user, party);
  }

  @ApiOperation({
    summary: 'Create reward records',
    description:
      'Role required: EASYCOIN. Creates RewardRecord contracts from a FinalReconciliation. If holdingCids is omitted, rewards are created for all active holdings of the instrument.',
  })
  @ApiParam({
    name: 'reconciliationCid',
    example: '00f7c1...',
    description: 'Daml contract ID of the FinalReconciliation contract',
  })
  @ApiResponse({
    status: 201,
    description: 'Reward records created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only EASYCOIN can create reward records',
  })
  @ApiResponse({
    status: 404,
    description: 'FinalReconciliation or holdings not found',
  })
  @Roles(UserRole.EASYCOIN)
  @Post(':reconciliationCid/rewards')
  createRewardRecords(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reconciliationCid') reconciliationCid: string,
    @Body() dto: CreateRewardRecordsDto,
  ) {
    return this.settlementsService.createRewardRecords(
      user,
      reconciliationCid,
      dto,
    );
  }

  @ApiOperation({
    summary: 'Close settlement',
    description:
      'Role required: EASYCOIN. Closes the managed contract after reward records are created.',
  })
  @ApiParam({
    name: 'reconciliationCid',
    example: '00f7c1...',
    description: 'Daml contract ID of the FinalReconciliation contract',
  })
  @ApiResponse({
    status: 201,
    description: 'Settlement closed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only EASYCOIN can close settlement',
  })
  @ApiResponse({
    status: 404,
    description: 'FinalReconciliation not found',
  })
  @Roles(UserRole.EASYCOIN)
  @Post(':reconciliationCid/close')
  closeSettlement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reconciliationCid') reconciliationCid: string,
    @Body() dto: CloseSettlementDto,
  ) {
    return this.settlementsService.closeSettlement(
      user,
      reconciliationCid,
      dto,
    );
  }
}
