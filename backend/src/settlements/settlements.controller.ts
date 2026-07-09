import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { SettlementsService } from './settlements.service';
import { SubmitFinalReconciliationDto } from './dto/submit-final-reconciliation.dto';
import { CreateRewardRecordsDto } from './dto/create-reward-records.dto';
import { CloseSettlementDto } from './dto/close-settlement.dto';

@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post('final')
  submitFinalReconciliation(@Body() dto: SubmitFinalReconciliationDto) {
    return this.settlementsService.submitFinalReconciliation(dto);
  }

  @Get()
  getSettlements(@Query('party') party?: string) {
    return this.settlementsService.getSettlements(party);
  }

  @Get('rewards')
  getRewardRecords(@Query('party') party?: string) {
    return this.settlementsService.getRewardRecords(party);
  }

  @Get('closed')
  getClosedContracts(@Query('party') party?: string) {
    return this.settlementsService.getClosedContracts(party);
  }

  @Post(':reconciliationCid/rewards')
  createRewardRecords(
    @Param('reconciliationCid') reconciliationCid: string,
    @Body() dto: CreateRewardRecordsDto,
  ) {
    return this.settlementsService.createRewardRecords(reconciliationCid, dto);
  }

  @Post(':reconciliationCid/close')
  closeSettlement(
    @Param('reconciliationCid') reconciliationCid: string,
    @Body() dto: CloseSettlementDto,
  ) {
    return this.settlementsService.closeSettlement(reconciliationCid, dto);
  }
}
