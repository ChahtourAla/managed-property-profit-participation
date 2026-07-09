import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { InstrumentsService } from './instruments.service';
import { CreateInstrumentDto } from './dto/create-instrument.dto';

@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @Post('create')
  createInstrument(@Body() dto: CreateInstrumentDto) {
    return this.instrumentsService.createInstrument(dto);
  }

  @Get()
  getInstruments(@Query('party') party?: string) {
    return this.instrumentsService.getInstruments(party);
  }

  @Get(':instrumentId')
  getInstrumentById(
    @Param('instrumentId') instrumentId: string,
    @Query('party') party?: string,
  ) {
    return this.instrumentsService.getInstrumentById(instrumentId, party);
  }

  @Get(':instrumentId/supply')
  getInstrumentSupply(
    @Param('instrumentId') instrumentId: string,
    @Query('party') party?: string,
  ) {
    return this.instrumentsService.getInstrumentSupply(instrumentId, party);
  }
}
