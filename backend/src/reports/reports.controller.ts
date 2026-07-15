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
import { AcceptReportDto } from './dto/accept-report.dto';
import { CreatePerformanceReportDto } from './dto/create-performance-report.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({
    summary: 'Create performance report',
    description:
      'Role required: EASYCOIN. Records a performance report for a tokenized instrument.',
  })
  @ApiResponse({
    status: 201,
    description: 'Performance report created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only EASYCOIN can create reports',
  })
  @ApiResponse({
    status: 404,
    description: 'Instrument not found',
  })
  @Roles(UserRole.EASYCOIN)
  @Post()
  createPerformanceReport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePerformanceReportDto,
  ) {
    return this.reportsService.createPerformanceReport(user, dto);
  }

  @ApiOperation({
    summary: 'List performance reports',
    description:
      'Returns PerformanceReport contracts visible to the authenticated user.',
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
    description: 'Reports returned successfully',
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
  getReports(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.reportsService.getReports(user, party);
  }

  @ApiOperation({
    summary: 'List accepted reports',
    description:
      'Returns ReportAccepted contracts visible to the authenticated user.',
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
    description: 'Accepted reports returned successfully',
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
  @Get('accepted')
  getAcceptedReports(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.reportsService.getAcceptedReports(user, party);
  }

  @ApiOperation({
    summary: 'List reports by instrument ID',
    description:
      'Returns PerformanceReport contracts linked to the provided business instrument ID.',
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
    description: 'Reports by instrument returned successfully',
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

  @ApiOperation({
    summary: 'Accept performance report',
    description:
      'Role required: AUDITOR. Accepts a PerformanceReport by Daml contract ID.',
  })
  @ApiParam({
    name: 'reportCid',
    example: '00f7c1...',
    description: 'Daml contract ID of the PerformanceReport',
  })
  @ApiResponse({
    status: 201,
    description: 'Report accepted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only AUDITOR can accept reports',
  })
  @ApiResponse({
    status: 404,
    description: 'PerformanceReport not found',
  })
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
