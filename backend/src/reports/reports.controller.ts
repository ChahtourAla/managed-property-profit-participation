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
import { AcceptReportDto } from './dto/accept-report.dto';
import { CreatePerformanceReportDto } from './dto/create-performance-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(UserRole.EASYCOIN)
  @Post()
  createPerformanceReport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePerformanceReportDto,
  ) {
    return this.reportsService.createPerformanceReport(user, dto);
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
  getReports(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.reportsService.getReports(user, party);
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
  @Get('accepted')
  getAcceptedReports(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.reportsService.getAcceptedReports(user, party);
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
  getReportsByInstrument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('instrumentId') instrumentId: string,
    @Query('party') party?: string,
  ) {
    return this.reportsService.getReportsByInstrument(
      user,
      instrumentId,
      party,
    );
  }

  @Roles(UserRole.AUDITOR)
  @Post(':reportCid/accept')
  acceptReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportCid') reportCid: string,
    @Body() dto: AcceptReportDto,
  ) {
    return this.reportsService.acceptReport(user, reportCid, dto);
  }
}
