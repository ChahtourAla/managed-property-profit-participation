import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { ApproveInvestorDto } from './dto/approve-investor.dto';
import { InvestorsService } from './investors.service';

@ApiTags('Investors')
@ApiBearerAuth()
@Controller('investors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvestorsController {
  constructor(private readonly investorsService: InvestorsService) {}

  @ApiOperation({
    summary: 'List eligible platform investors',
    description:
      'EASYCOIN or ADMIN only. Returns approved, active platform users with role INVESTOR and a linked Daml partyId. Easycoin uses this list to select investors before approving them on Daml.',
  })
  @ApiResponse({
    status: 200,
    description: 'Eligible platform investors returned successfully',
  })
  @Roles(UserRole.EASYCOIN, UserRole.ADMIN)
  @Get('eligible')
  getEligiblePlatformInvestors() {
    return this.investorsService.getEligiblePlatformInvestors();
  }

  @ApiOperation({
    summary: 'Approve investor on Daml',
    description:
      'EASYCOIN only. Creates an ApprovedInvestor contract on the Daml ledger for the selected investor party.',
  })
  @ApiResponse({
    status: 201,
    description: 'Investor approved successfully on Daml',
  })
  @Roles(UserRole.EASYCOIN)
  @Post('approve')
  approveInvestor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApproveInvestorDto,
  ) {
    return this.investorsService.approveInvestor(user, dto);
  }

  @ApiOperation({
    summary: 'List Daml-approved investors',
    description:
      'Returns ApprovedInvestor contracts from the Daml ledger. This is different from eligible platform investors.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daml-approved investors returned successfully',
  })
  @Roles(UserRole.EASYCOIN, UserRole.LEGAL_ADMIN, UserRole.INVESTOR)
  @Get('approved')
  getApprovedInvestors(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.investorsService.getApprovedInvestors(user, party);
  }
}
