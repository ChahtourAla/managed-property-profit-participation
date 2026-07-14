import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { DamlClientService } from '../daml/daml-client/daml-client.service';
import { DamlCommand, DamlCreatedEvent } from '../daml/daml.types';
import { filterByPath, getNestedValue } from '../daml/daml.utils';
import { getDefaultParties } from '../daml/parties';
import { TEMPLATE_IDS } from '../daml/template-ids';

import { RedeemAllHoldingsDto } from './dto/redeem-all-holdings.dto';
import { RedeemHoldingDto } from './dto/redeem-holding.dto';

@Injectable()
export class RedemptionsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async redeemHolding(
    user: AuthenticatedUser,
    closedCid: string,
    dto: RedeemHoldingDto,
  ) {
    const easycoin = this.requireUserParty(
      user,
      'Authenticated Easycoin user does not have a linked Daml partyId',
    );

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

  async redeemAllHoldings(
    user: AuthenticatedUser,
    closedCid: string,
    dto: RedeemAllHoldingsDto,
  ) {
    const easycoin = this.requireUserParty(
      user,
      'Authenticated Easycoin user does not have a linked Daml partyId',
    );

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

  async getRedemptionRecords(user: AuthenticatedUser, party?: string) {
    const readerParty = this.resolveReaderParty(user, party);

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.TokenRedemptionBurnRecord],
      parties: [readerParty],
      limit: 100,
    });
  }

  async getRedemptionRecordsByInstrument(
    user: AuthenticatedUser,
    instrumentId: string,
    party?: string,
  ) {
    const records = await this.getRedemptionRecords(user, party);

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
