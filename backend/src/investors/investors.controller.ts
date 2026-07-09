import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { InvestorsService } from './investors.service';
import { ApproveInvestorDto } from './dto/approve-investor.dto';

@Controller('investors')
export class InvestorsController {
  constructor(private readonly investorsService: InvestorsService) {}

  @Post('approve')
  approveInvestor(@Body() dto: ApproveInvestorDto) {
    return this.investorsService.approveInvestor(dto);
  }

  @Get('approved')
  getApprovedInvestors(@Query('party') party?: string) {
    return this.investorsService.getApprovedInvestors(party);
  }
}
