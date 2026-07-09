import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DamlClientService } from '../daml/daml-client/daml-client.service';
import { TEMPLATE_IDS } from '../daml/template-ids';
import { getDefaultParties } from '../daml/parties';

import { ConfirmRewardPaymentDto } from './dto/confirm-reward-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async confirmRewardPayment(rewardCid: string, dto: ConfirmRewardPaymentDto) {
    const defaultParties = getDefaultParties(this.configService);
    const paymentVerifier =
      dto.paymentVerifier || defaultParties.paymentVerifier;

    const rewardRecords = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.RewardRecord],
      parties: [paymentVerifier],
      limit: 100,
    });

    const rewardRecord = rewardRecords.find(
      (item) => item.contractId === rewardCid,
    );

    if (!rewardRecord) {
      throw new NotFoundException({
        message: 'RewardRecord not found',
        rewardCid,
      });
    }

    return this.damlClient.exerciseChoice({
      templateId: TEMPLATE_IDS.RewardRecord,
      contractId: rewardCid,
      choice: 'ConfirmRewardPayment',
      argument: {
        rewardPaymentReference: dto.rewardPaymentReference,
      },
      actAs: [paymentVerifier],
    });
  }

  async getRewardRecords(party?: string) {
    const defaultParties = getDefaultParties(this.configService);
    const readerParty = party || defaultParties.paymentVerifier;

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.RewardRecord],
      parties: [readerParty],
      limit: 100,
    });
  }

  async getRewardPaymentConfirmations(party?: string) {
    const defaultParties = getDefaultParties(this.configService);
    const readerParty = party || defaultParties.paymentVerifier;

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.RewardPaymentConfirmation],
      parties: [readerParty],
      limit: 100,
    });
  }
}
