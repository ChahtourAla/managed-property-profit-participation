import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { DamlClientService } from '../daml/daml-client/daml-client.service';
import { getDefaultParties } from '../daml/parties';
import { TEMPLATE_IDS } from '../daml/template-ids';
import { ConfirmRewardPaymentDto } from './dto/confirm-reward-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async getRewardRecords(user: AuthenticatedUser, party?: string) {
    const readerParty = this.resolveReaderParty(user, party);

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.RewardRecord],
      parties: [readerParty],
      limit: 100,
    });
  }

  async getRewardPaymentConfirmations(user: AuthenticatedUser, party?: string) {
    const readerParty = this.resolveReaderParty(user, party);

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.RewardPaymentConfirmation],
      parties: [readerParty],
      limit: 100,
    });
  }

  async confirmRewardPayment(
    user: AuthenticatedUser,
    rewardCid: string,
    dto: ConfirmRewardPaymentDto,
  ) {
    const paymentVerifier = this.requireUserParty(
      user,
      'Authenticated payment verifier user does not have a linked Daml partyId',
    );

    const rewards = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.RewardRecord],
      parties: [paymentVerifier],
      limit: 100,
    });

    const reward = rewards.find((item) => item.contractId === rewardCid);

    if (!reward) {
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
