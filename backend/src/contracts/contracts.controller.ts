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
import { ContractsService } from './contracts.service';
import { CreateOwnerDraftDto } from './dto/create-owner-draft.dto';
import { RejectContractDto } from './dto/reject-contract.dto';
import { ValidateContractDto } from './dto/validate-contract.dto';

@ApiTags('Contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @ApiOperation({
    summary: 'Create owner contract draft',
    description:
      'Role required: OWNER. Creates an owner-submitted managed property contract draft. The owner party is taken from the JWT user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Owner draft created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only OWNER can create a draft',
  })
  @Roles(UserRole.OWNER)
  @Post('owner-draft')
  createOwnerDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOwnerDraftDto,
  ) {
    return this.contractsService.createOwnerDraft(user, dto);
  }

  @ApiOperation({
    summary: 'List owner draft contracts',
    description:
      'Roles allowed: OWNER, EASYCOIN, LEGAL_ADMIN, AUDITOR. Normal users read only their own party view. EASYCOIN and ADMIN may use ?party=.',
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
    description: 'Draft contracts returned successfully',
  })
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

  @ApiOperation({
    summary: 'List validated contracts',
    description:
      'Roles allowed: OWNER, EASYCOIN, LEGAL_ADMIN, AUDITOR. Returns validated managed contracts visible to the authenticated user.',
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
    description: 'Validated contracts returned successfully',
  })
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

  @ApiOperation({
    summary: 'Validate owner draft',
    description:
      'Role required: EASYCOIN. Validates an owner-submitted draft using the business contract ID.',
  })
  @ApiParam({
    name: 'contractId',
    example: 'MPC-001',
    description: 'Business contract ID, not the Daml contract ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Contract validated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Owner draft not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Only EASYCOIN can validate drafts',
  })
  @Roles(UserRole.EASYCOIN)
  @Post(':contractId/validate')
  validateContract(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId') contractId: string,
    @Body() dto: ValidateContractDto,
  ) {
    return this.contractsService.validateContract(user, contractId, dto);
  }

  @ApiOperation({
    summary: 'Reject owner draft',
    description:
      'Role required: EASYCOIN. Rejects an owner-submitted draft using the business contract ID.',
  })
  @ApiParam({
    name: 'contractId',
    example: 'MPC-001',
    description: 'Business contract ID, not the Daml contract ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Contract rejected successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Owner draft not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Only EASYCOIN can reject drafts',
  })
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
