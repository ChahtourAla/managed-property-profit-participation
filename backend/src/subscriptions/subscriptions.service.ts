import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DamlClientService } from '../daml/daml-client/daml-client.service';
import { TEMPLATE_IDS } from '../daml/template-ids';
import { getDefaultParties } from '../daml/parties';
import { findByPath, getNestedValue, toDamlDecimal } from '../daml/daml.utils';

import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ConfirmFundingDto } from './dto/confirm-funding.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async createSubscription(dto: CreateSubscriptionDto) {
    const defaultParties = getDefaultParties(this.configService);
    const easycoin = dto.easycoin || defaultParties.easycoin;
    const investor = dto.investor;

    const instruments = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.TokenizedInstrument],
      parties: [investor],
      limit: 100,
    });

    const instrument = findByPath(
      instruments,
      'instrumentId',
      dto.instrumentId,
    );

    if (!instrument) {
      throw new NotFoundException({
        message:
          'Tokenized instrument not found or investor is not an observer on it',
        instrumentId: dto.instrumentId,
        investor,
      });
    }

    const approvals = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ApprovedInvestor],
      parties: [investor],
      limit: 100,
    });

    const approvedInvestor = approvals.find((approval) => {
      const approvalInvestor = getNestedValue(
        approval.createArguments,
        'investor',
      );
      const approvalEasycoin = getNestedValue(
        approval.createArguments,
        'easycoin',
      );

      return approvalInvestor === investor && approvalEasycoin === easycoin;
    });

    if (!approvedInvestor) {
      throw new NotFoundException({
        message: 'ApprovedInvestor contract not found for investor',
        investor,
        easycoin,
      });
    }

    return this.damlClient.exerciseChoice({
      templateId: TEMPLATE_IDS.TokenizedInstrument,
      contractId: instrument.contractId,
      choice: 'Subscribe',
      argument: {
        investor,
        approvedInvestorCid: approvedInvestor.contractId,
        requestedUnits: toDamlDecimal(dto.requestedUnits),
        upfrontAmount: toDamlDecimal(dto.upfrontAmount),
        paymentReference: dto.paymentReference,
      },
      actAs: [investor],
    });
  }

  async confirmFunding(subscriptionCid: string, dto: ConfirmFundingDto) {
    const defaultParties = getDefaultParties(this.configService);

    const easycoin = dto.easycoin || defaultParties.easycoin;
    const paymentVerifier =
      dto.paymentVerifier || defaultParties.paymentVerifier;

    const subscriptions = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.InvestorSubscription],
      parties: [paymentVerifier],
      limit: 100,
    });

    const subscription = subscriptions.find(
      (contract) => contract.contractId === subscriptionCid,
    );

    if (!subscription) {
      throw new NotFoundException({
        message: 'InvestorSubscription contract not found',
        subscriptionCid,
      });
    }

    const instrumentId = getNestedValue(
      subscription.createArguments,
      'instrumentId',
    ) as string | undefined;

    if (!instrumentId) {
      throw new NotFoundException({
        message: 'instrumentId not found inside InvestorSubscription',
        subscriptionCid,
      });
    }

    const supplyCid =
      dto.supplyCid || (await this.findActiveSupplyCid(instrumentId, easycoin));

    return this.damlClient.exerciseChoice({
      templateId: TEMPLATE_IDS.InvestorSubscription,
      contractId: subscriptionCid,
      choice: 'ConfirmFunding',
      argument: {
        confirmedPaymentReference: dto.confirmedPaymentReference,
        supplyCid,
      },
      actAs: [paymentVerifier, easycoin],
    });
  }

  async getSubscriptions(party?: string) {
    const defaultParties = getDefaultParties(this.configService);
    const readerParty = party || defaultParties.easycoin;

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.InvestorSubscription],
      parties: [readerParty],
      limit: 100,
    });
  }

  async getFundingConfirmations(party?: string) {
    const defaultParties = getDefaultParties(this.configService);
    const readerParty = party || defaultParties.easycoin;

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.FundingConfirmation],
      parties: [readerParty],
      limit: 100,
    });
  }

  private async findActiveSupplyCid(
    instrumentId: string,
    easycoin: string,
  ): Promise<string> {
    const supplies = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.TokenSupply],
      parties: [easycoin],
      limit: 100,
    });

    const supply = findByPath(supplies, 'instrumentId', instrumentId);

    if (!supply) {
      throw new NotFoundException({
        message: 'Active TokenSupply not found for instrument',
        instrumentId,
      });
    }

    return supply.contractId;
  }
}
