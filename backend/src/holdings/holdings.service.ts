import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DamlClientService } from '../daml/daml-client/daml-client.service';
import { TEMPLATE_IDS } from '../daml/template-ids';
import { getDefaultParties } from '../daml/parties';
import { filterByPath, findByPath } from '../daml/daml.utils';

@Injectable()
export class HoldingsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async getHoldings(party?: string) {
    const defaultParties = getDefaultParties(this.configService);

    /**
     * By default we query as Easycoin because Easycoin is signatory
     * on all ProfitParticipationHolding contracts.
     */
    const readerParty = party || defaultParties.easycoin;

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ProfitParticipationHolding],
      parties: [readerParty],
      limit: 100,
    });
  }

  async getHoldingsByHolder(holder: string, readerParty?: string) {
    const defaultParties = getDefaultParties(this.configService);

    /**
     * The reader can be:
     * - the holder himself
     * - Easycoin
     * - another observer/signatory party
     */
    const party = readerParty || holder || defaultParties.easycoin;

    const holdings = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ProfitParticipationHolding],
      parties: [party],
      limit: 100,
    });

    const holderHoldings = filterByPath(holdings, 'holder', holder);

    return holderHoldings;
  }

  async getHoldingsByInstrument(instrumentId: string, party?: string) {
    const defaultParties = getDefaultParties(this.configService);
    const readerParty = party || defaultParties.easycoin;

    const holdings = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ProfitParticipationHolding],
      parties: [readerParty],
      limit: 100,
    });

    const instrumentHoldings = filterByPath(
      holdings,
      'instrumentIdText',
      instrumentId,
    );

    return instrumentHoldings;
  }

  async getHoldingByCid(holdingCid: string, party?: string) {
    const defaultParties = getDefaultParties(this.configService);
    const readerParty = party || defaultParties.easycoin;

    const holdings = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ProfitParticipationHolding],
      parties: [readerParty],
      limit: 100,
    });

    const holding = findByPath(holdings, 'contractId', holdingCid);

    /**
     * Sometimes contractId is not inside createArguments,
     * it is at the top level of the created event.
     */
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
}
