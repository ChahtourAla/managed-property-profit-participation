import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { DamlClientService } from '../daml/daml-client/daml-client.service';
import { filterByPath, findByPath, toDamlDecimal } from '../daml/daml.utils';
import { getDefaultParties } from '../daml/parties';
import { TEMPLATE_IDS } from '../daml/template-ids';

import { CreateInstrumentDto } from './dto/create-instrument.dto';

@Injectable()
export class InstrumentsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async createInstrument(user: AuthenticatedUser, dto: CreateInstrumentDto) {
    const easycoin = this.requireUserParty(
      user,
      'Authenticated Easycoin user does not have a linked Daml partyId',
    );

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

  async getInstruments(user: AuthenticatedUser, party?: string) {
    const readerParty = this.resolveReaderParty(user, party);

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.TokenizedInstrument],
      parties: [readerParty],
      limit: 100,
    });
  }

  async getInstrumentById(
    user: AuthenticatedUser,
    instrumentId: string,
    party?: string,
  ) {
    const instruments = await this.getInstruments(user, party);

    const instrument = findByPath(instruments, 'instrumentId', instrumentId);

    if (!instrument) {
      throw new NotFoundException({
        message: 'Tokenized instrument not found',
        instrumentId,
      });
    }

    return instrument;
  }

  async getTokenSupply(
    user: AuthenticatedUser,
    instrumentId: string,
    party?: string,
  ) {
    return this.getInstrumentSupply(user, instrumentId, party);
  }

  async getInstrumentSupply(
    user: AuthenticatedUser,
    instrumentId: string,
    party?: string,
  ) {
    const readerParty = this.resolveReaderParty(user, party);

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

  private resolveReaderParty(
    user: AuthenticatedUser,
    requestedParty?: string,
  ): string {
    const defaultParties = getDefaultParties(this.configService);

    const canUseRequestedParty =
      user.role === UserRole.ADMIN || user.role === UserRole.EASYCOIN;

    if (canUseRequestedParty && requestedParty) {
      return requestedParty;
    }

    if (user.partyId) {
      return user.partyId;
    }

    if (user.role === UserRole.ADMIN) {
      return defaultParties.easycoin;
    }

    throw new BadRequestException(
      'Authenticated user does not have a linked Daml partyId',
    );
  }

  private requireUserParty(user: AuthenticatedUser, errorMessage: string) {
    if (!user.partyId) {
      throw new BadRequestException(errorMessage);
    }

    return user.partyId;
  }
}
