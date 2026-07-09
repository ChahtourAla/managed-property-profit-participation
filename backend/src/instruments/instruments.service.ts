import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DamlClientService } from '../daml/daml-client/daml-client.service';
import { TEMPLATE_IDS } from '../daml/template-ids';
import { getDefaultParties } from '../daml/parties';
import { filterByPath, findByPath, toDamlDecimal } from '../daml/daml.utils';

import { CreateInstrumentDto } from './dto/create-instrument.dto';

@Injectable()
export class InstrumentsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async createInstrument(dto: CreateInstrumentDto) {
    const defaultParties = getDefaultParties(this.configService);
    const easycoin = dto.easycoin || defaultParties.easycoin;

    const validatedContracts = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ValidatedManagedContract],
      parties: [easycoin],
      limit: 100,
    });

    const validatedContract = findByPath(
      validatedContracts,
      'contractData.contractId',
      dto.contractId,
    );

    if (!validatedContract) {
      throw new NotFoundException({
        message: 'Validated managed contract not found',
        contractId: dto.contractId,
      });
    }

    return this.damlClient.exerciseChoice({
      templateId: TEMPLATE_IDS.ValidatedManagedContract,
      contractId: validatedContract.contractId,
      choice: 'CreateTokenizedInstrument',
      argument: {
        instrumentId: dto.instrumentId,
        totalUnits: toDamlDecimal(dto.totalUnits),
        nominalValuePerUnit: toDamlDecimal(dto.nominalValuePerUnit),
        investorUpfrontPricePerUnit: toDamlDecimal(
          dto.investorUpfrontPricePerUnit,
        ),
        approvedInvestors: dto.approvedInvestors,
      },
      actAs: [easycoin],
    });
  }

  async getInstruments(party?: string) {
    const defaultParties = getDefaultParties(this.configService);
    const readerParty = party || defaultParties.easycoin;

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.TokenizedInstrument],
      parties: [readerParty],
      limit: 100,
    });
  }

  async getInstrumentById(instrumentId: string, party?: string) {
    const instruments = await this.getInstruments(party);

    const instrument = findByPath(instruments, 'instrumentId', instrumentId);

    if (!instrument) {
      throw new NotFoundException({
        message: 'Tokenized instrument not found',
        instrumentId,
      });
    }

    return instrument;
  }

  async getInstrumentSupply(instrumentId: string, party?: string) {
    const defaultParties = getDefaultParties(this.configService);
    const readerParty = party || defaultParties.easycoin;

    const supplies = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.TokenSupply],
      parties: [readerParty],
      limit: 100,
    });

    const matchingSupplies = filterByPath(
      supplies,
      'instrumentId',
      instrumentId,
    );

    if (matchingSupplies.length === 0) {
      throw new NotFoundException({
        message: 'Token supply not found for instrument',
        instrumentId,
      });
    }

    return matchingSupplies;
  }
}
