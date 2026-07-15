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
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { InstrumentsService } from './instruments.service';

@ApiTags('Instruments')
@ApiBearerAuth()
@Controller('instruments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @ApiOperation({
    summary: 'Create tokenized instrument',
    description:
      'Role required: EASYCOIN. Creates a tokenized profit participation instrument from a validated managed contract.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tokenized instrument created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Validated contract not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Only EASYCOIN can create instruments',
  })
  @Roles(UserRole.EASYCOIN)
  @Post('create')
  createInstrument(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInstrumentDto,
  ) {
    return this.instrumentsService.createInstrument(user, dto);
  }

  @ApiOperation({
    summary: 'List tokenized instruments',
    description:
      'Roles allowed: EASYCOIN, OWNER, INVESTOR, AUDITOR, LEGAL_ADMIN. Normal users read only their own party view.',
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
    description: 'Instruments returned successfully',
  })
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

  @ApiOperation({
    summary: 'Get instrument by business ID',
    description:
      'Returns one tokenized instrument by its business instrument ID.',
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
    description: 'Instrument returned successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Instrument not found',
  })
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

  @ApiOperation({
    summary: 'Get token supply by instrument ID',
    description:
      'Returns TokenSupply contracts linked to a business instrument ID.',
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
    description: 'Token supply returned successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Token supply not found',
  })
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
