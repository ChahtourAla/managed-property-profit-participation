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
import { ContractsService } from './contracts.service';
import { CreateOwnerDraftDto } from './dto/create-owner-draft.dto';
import { RejectContractDto } from './dto/reject-contract.dto';
import { ValidateContractDto } from './dto/validate-contract.dto';

@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Roles(UserRole.OWNER)
  @Post('owner-draft')
  createOwnerDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOwnerDraftDto,
  ) {
    return this.contractsService.createOwnerDraft(user, dto);
  }

  @Roles(
    UserRole.OWNER,
    UserRole.EASYCOIN,
    UserRole.LEGAL_ADMIN,
    UserRole.AUDITOR,
  )
  @Get('drafts')
  getOwnerDrafts(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.contractsService.getOwnerDrafts(user, party);
  }

  @Roles(
    UserRole.OWNER,
    UserRole.EASYCOIN,
    UserRole.LEGAL_ADMIN,
    UserRole.AUDITOR,
  )
  @Get('validated')
  getValidatedContracts(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.contractsService.getValidatedContracts(user, party);
  }

  @Roles(UserRole.EASYCOIN)
  @Post(':contractId/validate')
  validateContract(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId') contractId: string,
    @Body() dto: ValidateContractDto,
  ) {
    return this.contractsService.validateContract(user, contractId, dto);
  }

  @Roles(UserRole.EASYCOIN)
  @Post(':contractId/reject')
  rejectContract(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId') contractId: string,
    @Body() dto: RejectContractDto,
  ) {
    return this.contractsService.rejectContract(user, contractId, dto);
  }
}
