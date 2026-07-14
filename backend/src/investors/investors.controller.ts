import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { ApproveInvestorDto } from './dto/approve-investor.dto';
import { InvestorsService } from './investors.service';

@Controller('investors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvestorsController {
  constructor(private readonly investorsService: InvestorsService) {}

  @Roles(UserRole.EASYCOIN)
  @Post('approve')
  approveInvestor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApproveInvestorDto,
  ) {
    return this.investorsService.approveInvestor(user, dto);
  }

  @Roles(UserRole.EASYCOIN, UserRole.LEGAL_ADMIN, UserRole.INVESTOR)
  @Get('approved')
  getApprovedInvestors(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.investorsService.getApprovedInvestors(user, party);
  }
}
