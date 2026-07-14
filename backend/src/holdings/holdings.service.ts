import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { DamlClientService } from '../daml/daml-client/daml-client.service';
import { filterByPath, findByPath } from '../daml/daml.utils';
import { getDefaultParties } from '../daml/parties';
import { TEMPLATE_IDS } from '../daml/template-ids';

@Injectable()
export class HoldingsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async getHoldings(user: AuthenticatedUser, party?: string) {
    const readerParty = this.resolveReaderParty(user, party);

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ProfitParticipationHolding],
      parties: [readerParty],
      limit: 100,
    });
  }

  async getHoldingsByHolder(
    user: AuthenticatedUser,
    holder: string,
    readerParty?: string,
  ) {
    const canReadOtherHolder = this.canReadOtherParties(user);

    const effectiveHolder = canReadOtherHolder
      ? holder
      : this.requireUserParty(user);

    const effectiveReaderParty = canReadOtherHolder
      ? this.resolveReaderParty(user, readerParty)
      : this.requireUserParty(user);

    const holdings = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ProfitParticipationHolding],
      parties: [effectiveReaderParty],
      limit: 100,
    });

    return filterByPath(holdings, 'holder', effectiveHolder);
  }

  async getHoldingsByInstrument(
    user: AuthenticatedUser,
    instrumentId: string,
    party?: string,
  ) {
    const readerParty = this.resolveReaderParty(user, party);

    const holdings = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ProfitParticipationHolding],
      parties: [readerParty],
      limit: 100,
    });

    return filterByPath(holdings, 'instrumentIdText', instrumentId);
  }

  async getHoldingByCid(
    user: AuthenticatedUser,
    holdingCid: string,
    party?: string,
  ) {
    const readerParty = this.resolveReaderParty(user, party);

    const holdings = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ProfitParticipationHolding],
      parties: [readerParty],
      limit: 100,
    });

    const holding = findByPath(holdings, 'contractId', holdingCid);

    const matchingHolding =
      holding || holdings.find((item) => item.contractId === holdingCid);

    if (!matchingHolding) {
      throw new NotFoundException({
        message: 'ProfitParticipationHolding not found',
        holdingCid,
      });
    }

    return matchingHolding;
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

  private requireUserParty(user: AuthenticatedUser): string {
    if (!user.partyId) {
      throw new BadRequestException(
        'Authenticated user does not have a linked Daml partyId',
      );
    }

    return user.partyId;
  }

  private canReadOtherParties(user: AuthenticatedUser): boolean {
    return [
      UserRole.ADMIN,
      UserRole.EASYCOIN,
      UserRole.AUDITOR,
      UserRole.LEGAL_ADMIN,
      UserRole.PAYMENT_VERIFIER,
    ].includes(user.role);
  }
}
