import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DamlClientService } from '../daml/daml-client/daml-client.service';
import { DamlCommand, DamlCreatedEvent } from '../daml/daml.types';
import { TEMPLATE_IDS } from '../daml/template-ids';
import { getDefaultParties } from '../daml/parties';
import { filterByPath, getNestedValue } from '../daml/daml.utils';

import { RedeemHoldingDto } from './dto/redeem-holding.dto';
import { RedeemAllHoldingsDto } from './dto/redeem-all-holdings.dto';

@Injectable()
export class RedemptionsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async redeemHolding(closedCid: string, dto: RedeemHoldingDto) {
    const defaultParties = getDefaultParties(this.configService);
    const easycoin = dto.easycoin || defaultParties.easycoin;

    await this.findClosedContractByCid(closedCid, easycoin);
    await this.findHoldingByCid(dto.holdingCid, easycoin);

    return this.damlClient.exerciseChoice({
      templateId: TEMPLATE_IDS.ClosedManagedContract,
      contractId: closedCid,
      choice: 'RedeemHolding',
      argument: {
        holdingCid: dto.holdingCid,
        burnReference: dto.burnReference,
      },
      actAs: [easycoin],
    });
  }

  async redeemAllHoldings(closedCid: string, dto: RedeemAllHoldingsDto) {
    const defaultParties = getDefaultParties(this.configService);
    const easycoin = dto.easycoin || defaultParties.easycoin;

    const closedContract = await this.findClosedContractByCid(
      closedCid,
      easycoin,
    );

    const instrumentId = getNestedValue(
      closedContract.createArguments,
      'instrumentId',
    ) as string | undefined;

    if (!instrumentId) {
      throw new NotFoundException({
        message: 'instrumentId not found inside ClosedManagedContract',
        closedCid,
      });
    }

    const holdings = await this.getActiveHoldingsByInstrument(
      instrumentId,
      easycoin,
    );

    if (holdings.length === 0) {
      throw new NotFoundException({
        message: 'No active holdings found for redemption',
        instrumentId,
      });
    }

    const prefix = dto.burnReferencePrefix || `BURN-${instrumentId}`;

    const commands: DamlCommand[] = holdings.map((holding, index) => {
      const holder = getNestedValue(holding.createArguments, 'holder') as
        string | undefined;

      const cleanHolder = holder
        ? holder.split('::')[0].replace(/[^a-zA-Z0-9-_]/g, '')
        : `HOLDER-${index + 1}`;

      return {
        ExerciseCommand: {
          templateId: TEMPLATE_IDS.ClosedManagedContract,
          contractId: closedCid,
          choice: 'RedeemHolding',
          choiceArgument: {
            holdingCid: holding.contractId,
            burnReference: `${prefix}-${cleanHolder}-${index + 1}`,
          },
        },
      };
    });

    return this.damlClient.submitCommands({
      actAs: [easycoin],
      commands,
      workflowId: 'redeem-all-holdings',
    });
  }

  async getRedemptionRecords(party?: string) {
    const defaultParties = getDefaultParties(this.configService);
    const readerParty = party || defaultParties.easycoin;

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.TokenRedemptionBurnRecord],
      parties: [readerParty],
      limit: 100,
    });
  }

  async getRedemptionRecordsByInstrument(instrumentId: string, party?: string) {
    const records = await this.getRedemptionRecords(party);

    return filterByPath(records, 'instrumentId', instrumentId);
  }

  private async findClosedContractByCid(
    closedCid: string,
    party: string,
  ): Promise<DamlCreatedEvent> {
    const closedContracts = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ClosedManagedContract],
      parties: [party],
      limit: 100,
    });

    const closedContract = closedContracts.find(
      (item) => item.contractId === closedCid,
    );

    if (!closedContract) {
      throw new NotFoundException({
        message: 'ClosedManagedContract not found',
        closedCid,
      });
    }

    return closedContract;
  }

  private async findHoldingByCid(
    holdingCid: string,
    party: string,
  ): Promise<DamlCreatedEvent> {
    const holdings = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ProfitParticipationHolding],
      parties: [party],
      limit: 100,
    });

    const holding = holdings.find((item) => item.contractId === holdingCid);

    if (!holding) {
      throw new NotFoundException({
        message: 'ProfitParticipationHolding not found',
        holdingCid,
      });
    }

    return holding;
  }

  private async getActiveHoldingsByInstrument(
    instrumentId: string,
    party: string,
  ): Promise<DamlCreatedEvent[]> {
    const holdings = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ProfitParticipationHolding],
      parties: [party],
      limit: 100,
    });

    return filterByPath(holdings, 'instrumentIdText', instrumentId);
  }
}
