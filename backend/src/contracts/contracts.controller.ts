import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { ContractsService } from './contracts.service';
import { CreateOwnerDraftDto } from './dto/create-owner-draft.dto';
import { ValidateContractDto } from './dto/validate-contract.dto';
import { RejectContractDto } from './dto/reject-contract.dto';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post('owner-draft')
  createOwnerDraft(@Body() dto: CreateOwnerDraftDto) {
    return this.contractsService.createOwnerDraft(dto);
  }

  @Get('drafts')
  getOwnerDrafts(@Query('party') party?: string) {
    return this.contractsService.getOwnerDrafts(party);
  }

  @Get('validated')
  getValidatedContracts(@Query('party') party?: string) {
    return this.contractsService.getValidatedContracts(party);
  }

  @Post(':contractId/validate')
  validateContract(
    @Param('contractId') contractId: string,
    @Body() dto: ValidateContractDto,
  ) {
    return this.contractsService.validateContract(contractId, dto);
  }

  @Post(':contractId/reject')
  rejectContract(
    @Param('contractId') contractId: string,
    @Body() dto: RejectContractDto,
  ) {
    return this.contractsService.rejectContract(contractId, dto);
  }
}
