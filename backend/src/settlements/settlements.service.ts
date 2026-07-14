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
import {
  filterByPath,
  findByPath,
  getNestedValue,
  toDamlDecimal,
} from '../daml/daml.utils';
import { getDefaultParties } from '../daml/parties';
import { TEMPLATE_IDS } from '../daml/template-ids';

import { CloseSettlementDto } from './dto/close-settlement.dto';
import { CreateRewardRecordsDto } from './dto/create-reward-records.dto';
import { SubmitFinalReconciliationDto } from './dto/submit-final-reconciliation.dto';

@Injectable()
export class SettlementsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async submitFinalReconciliation(
    user: AuthenticatedUser,
    dto: SubmitFinalReconciliationDto,
  ) {
    const easycoin = this.requireUserParty(
      user,
      'Authenticated Easycoin user does not have a linked Daml partyId',
    );

    const instruments = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.TokenizedInstrument],
      parties: [easycoin],
      limit: 100,
    });

    const instrument = findByPath(
      instruments,
      'instrumentId',
      dto.instrumentId,
    );

    if (!instrument) {
      throw new NotFoundException({
        message: 'TokenizedInstrument not found',
        instrumentId: dto.instrumentId,
      });
    }

    return this.damlClient.exerciseChoice({
      templateId: TEMPLATE_IDS.TokenizedInstrument,
      contractId: instrument.contractId,
      choice: 'SubmitFinalReconciliation',
      argument: {
        totalRentalIncome: toDamlDecimal(dto.totalRentalIncome),
        totalExpenses: toDamlDecimal(dto.totalExpenses),
        netProfitBeforeFee: toDamlDecimal(dto.netProfitBeforeFee),
        easycoinFee: toDamlDecimal(dto.easycoinFee),
        ownerSideDistributableProfit: toDamlDecimal(
          dto.ownerSideDistributableProfit,
        ),
        investorRewardPool: toDamlDecimal(dto.investorRewardPool),
        ownerRetainedProfit: toDamlDecimal(dto.ownerRetainedProfit),
        finalReportHash: dto.finalReportHash,
      },
      actAs: [easycoin],
    });
  }

  async createRewardRecords(
    user: AuthenticatedUser,
    reconciliationCid: string,
    dto: CreateRewardRecordsDto,
  ) {
    const easycoin = this.requireUserParty(
      user,
      'Authenticated Easycoin user does not have a linked Daml partyId',
    );

    const reconciliation = await this.findReconciliationByCid(
      reconciliationCid,
      easycoin,
    );

    const instrumentId = getNestedValue(
      reconciliation.createArguments,
      'instrumentId',
    ) as string | undefined;

    if (!instrumentId) {
      throw new NotFoundException({
        message: 'instrumentId not found inside FinalReconciliation',
        reconciliationCid,
      });
    }

    const holdings = await this.getRewardTargetHoldings({
      easycoin,
      instrumentId,
      holdingCids: dto.holdingCids,
    });

    if (holdings.length === 0) {
      throw new NotFoundException({
        message: 'No active holdings found for reward creation',
        instrumentId,
      });
    }

    const commands: DamlCommand[] = holdings.map((holding) => {
      const recipient = getNestedValue(holding.createArguments, 'holder') as
        string | undefined;

      if (!recipient) {
        throw new NotFoundException({
          message: 'holder not found inside ProfitParticipationHolding',
          holdingCid: holding.contractId,
        });
      }

      return {
        ExerciseCommand: {
          templateId: TEMPLATE_IDS.FinalReconciliation,
          contractId: reconciliationCid,
          choice: 'CreateRewardRecord',
          choiceArgument: {
            recipient,
            holdingCid: holding.contractId,
          },
        },
      };
    });

    return this.damlClient.submitCommands({
      actAs: [easycoin],
      commands,
      workflowId: 'create-reward-records',
    });
  }

  async closeSettlement(
    user: AuthenticatedUser,
    reconciliationCid: string,
    dto: CloseSettlementDto,
  ) {
    const easycoin = this.requireUserParty(
      user,
      'Authenticated Easycoin user does not have a linked Daml partyId',
    );

    await this.findReconciliationByCid(reconciliationCid, easycoin);

    return this.damlClient.exerciseChoice({
      templateId: TEMPLATE_IDS.FinalReconciliation,
      contractId: reconciliationCid,
      choice: 'CloseAfterSettlement',
      argument: {
        closureNote: dto.closureNote,
      },
      actAs: [easycoin],
    });
  }

  async getSettlements(user: AuthenticatedUser, party?: string) {
    const readerParty = this.resolveReaderParty(user, party);

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.FinalReconciliation],
      parties: [readerParty],
      limit: 100,
    });
  }

  async getRewardRecords(user: AuthenticatedUser, party?: string) {
    const readerParty = this.resolveReaderParty(user, party);

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.RewardRecord],
      parties: [readerParty],
      limit: 100,
    });
  }

  async getClosedContracts(user: AuthenticatedUser, party?: string) {
    const readerParty = this.resolveReaderParty(user, party);

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ClosedManagedContract],
      parties: [readerParty],
      limit: 100,
    });
  }

  private async findReconciliationByCid(
    reconciliationCid: string,
    party: string,
  ): Promise<DamlCreatedEvent> {
    const reconciliations = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.FinalReconciliation],
      parties: [party],
      limit: 100,
    });

    const reconciliation = reconciliations.find(
      (item) => item.contractId === reconciliationCid,
    );

    if (!reconciliation) {
      throw new NotFoundException({
        message: 'FinalReconciliation not found',
        reconciliationCid,
      });
    }

    return reconciliation;
  }

  private async getRewardTargetHoldings(params: {
    easycoin: string;
    instrumentId: string;
    holdingCids?: string[];
  }): Promise<DamlCreatedEvent[]> {
    const holdings = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ProfitParticipationHolding],
      parties: [params.easycoin],
      limit: 100,
    });

    const instrumentHoldings = filterByPath(
      holdings,
      'instrumentIdText',
      params.instrumentId,
    );

    if (!params.holdingCids || params.holdingCids.length === 0) {
      return instrumentHoldings;
    }

    return instrumentHoldings.filter((holding) =>
      params.holdingCids?.includes(holding.contractId),
    );
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
