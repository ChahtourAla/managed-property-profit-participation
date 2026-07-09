import { Controller, Get, Param, Query } from '@nestjs/common';

import { HoldingsService } from './holdings.service';

@Controller('holdings')
export class HoldingsController {
  constructor(private readonly holdingsService: HoldingsService) {}

  @Get()
  getHoldings(@Query('party') party?: string) {
    return this.holdingsService.getHoldings(party);
  }

  @Get('party/:holder')
  getHoldingsByHolder(
    @Param('holder') holder: string,
    @Query('reader') reader?: string,
  ) {
    return this.holdingsService.getHoldingsByHolder(holder, reader);
  }

  @Get('instrument/:instrumentId')
  getHoldingsByInstrument(
    @Param('instrumentId') instrumentId: string,
    @Query('party') party?: string,
  ) {
    return this.holdingsService.getHoldingsByInstrument(instrumentId, party);
  }

  @Get('cid/:holdingCid')
  getHoldingByCid(
    @Param('holdingCid') holdingCid: string,
    @Query('party') party?: string,
  ) {
    return this.holdingsService.getHoldingByCid(holdingCid, party);
  }
}
