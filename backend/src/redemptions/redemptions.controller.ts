import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { RedemptionsService } from './redemptions.service';
import { RedeemHoldingDto } from './dto/redeem-holding.dto';
import { RedeemAllHoldingsDto } from './dto/redeem-all-holdings.dto';

@Controller('redemptions')
export class RedemptionsController {
  constructor(private readonly redemptionsService: RedemptionsService) {}

  @Get()
  getRedemptionRecords(@Query('party') party?: string) {
    return this.redemptionsService.getRedemptionRecords(party);
  }

  @Get('instrument/:instrumentId')
  getRedemptionRecordsByInstrument(
    @Param('instrumentId') instrumentId: string,
    @Query('party') party?: string,
  ) {
    return this.redemptionsService.getRedemptionRecordsByInstrument(
      instrumentId,
      party,
    );
  }

  @Post(':closedCid/redeem')
  redeemHolding(
    @Param('closedCid') closedCid: string,
    @Body() dto: RedeemHoldingDto,
  ) {
    return this.redemptionsService.redeemHolding(closedCid, dto);
  }

  @Post(':closedCid/redeem-all')
  redeemAllHoldings(
    @Param('closedCid') closedCid: string,
    @Body() dto: RedeemAllHoldingsDto,
  ) {
    return this.redemptionsService.redeemAllHoldings(closedCid, dto);
  }
}
