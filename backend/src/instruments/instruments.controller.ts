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
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { InstrumentsService } from './instruments.service';

@Controller('instruments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @Roles(UserRole.EASYCOIN)
  @Post('create')
  createInstrument(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInstrumentDto,
  ) {
    return this.instrumentsService.createInstrument(user, dto);
  }

  @Roles(
    UserRole.EASYCOIN,
    UserRole.OWNER,
    UserRole.INVESTOR,
    UserRole.AUDITOR,
    UserRole.LEGAL_ADMIN,
  )
  @Get()
  getInstruments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('party') party?: string,
  ) {
    return this.instrumentsService.getInstruments(user, party);
  }

  @Roles(
    UserRole.EASYCOIN,
    UserRole.OWNER,
    UserRole.INVESTOR,
    UserRole.AUDITOR,
    UserRole.LEGAL_ADMIN,
  )
  @Get(':instrumentId')
  getInstrumentById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('instrumentId') instrumentId: string,
    @Query('party') party?: string,
  ) {
    return this.instrumentsService.getInstrumentById(user, instrumentId, party);
  }

  @Roles(
    UserRole.EASYCOIN,
    UserRole.OWNER,
    UserRole.INVESTOR,
    UserRole.AUDITOR,
    UserRole.LEGAL_ADMIN,
  )
  @Get(':instrumentId/supply')
  getTokenSupply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('instrumentId') instrumentId: string,
    @Query('party') party?: string,
  ) {
    return this.instrumentsService.getTokenSupply(user, instrumentId, party);
  }
}
