import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { ReportsService } from './reports.service';
import { CreatePerformanceReportDto } from './dto/create-performance-report.dto';
import { AcceptReportDto } from './dto/accept-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  createPerformanceReport(@Body() dto: CreatePerformanceReportDto) {
    return this.reportsService.createPerformanceReport(dto);
  }

  @Get()
  getReports(@Query('party') party?: string) {
    return this.reportsService.getReports(party);
  }

  @Get('accepted')
  getAcceptedReports(@Query('party') party?: string) {
    return this.reportsService.getAcceptedReports(party);
  }

  @Get('instrument/:instrumentId')
  getReportsByInstrument(
    @Param('instrumentId') instrumentId: string,
    @Query('party') party?: string,
  ) {
    return this.reportsService.getReportsByInstrument(instrumentId, party);
  }

  @Post(':reportCid/accept')
  acceptReport(
    @Param('reportCid') reportCid: string,
    @Body() dto: AcceptReportDto,
  ) {
    return this.reportsService.acceptReport(reportCid, dto);
  }
}
