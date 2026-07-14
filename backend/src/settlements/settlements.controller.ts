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
import { CloseSettlementDto } from './dto/close-settlement.dto';
import { CreateRewardRecordsDto } from './dto/create-reward-records.dto';
import { SubmitFinalReconciliationDto } from './dto/submit-final-reconciliation.dto';
import { SettlementsService } from './settlements.service';

@Controller('settlements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Roles(UserRole.EASYCOIN)
  @Post('final')
  submitFinalReconciliation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitFinalReconciliationDto,
  ) {
    return this.settlementsService.submitFinalReconciliation(user, dto);
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
  getSettlements(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.settlementsService.getSettlements(user, party);
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
  @Get('rewards')
  getRewardRecords(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.settlementsService.getRewardRecords(user, party);
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
  @Get('closed')
  getClosedContracts(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.settlementsService.getClosedContracts(user, party);
  }

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
