import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
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
import { ApproveInvestorDto } from './dto/approve-investor.dto';
import { InvestorsService } from './investors.service';

@ApiTags('Investors')
@ApiBearerAuth()
@Controller('investors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvestorsController {
  constructor(private readonly investorsService: InvestorsService) {}

  @ApiOperation({
    summary: 'Approve investor',
    description:
      'Role required: EASYCOIN. Creates an ApprovedInvestor contract for a Daml investor party.',
  })
  @ApiResponse({
    status: 201,
    description: 'Investor approved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only EASYCOIN can approve investors',
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
    summary: 'List approved investors',
    description:
      'Roles allowed: EASYCOIN, LEGAL_ADMIN, INVESTOR. Normal users read only their own party view. EASYCOIN and ADMIN may use ?party=.',
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
    description: 'Approved investors returned successfully',
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
