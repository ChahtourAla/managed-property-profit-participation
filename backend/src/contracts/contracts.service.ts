import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { DamlClientService } from '../daml/daml-client/daml-client.service';
import { findByPath, toDamlDecimal } from '../daml/daml.utils';
import { getDefaultParties } from '../daml/parties';
import { TEMPLATE_IDS } from '../daml/template-ids';

import { CreateOwnerDraftDto } from './dto/create-owner-draft.dto';
import { RejectContractDto } from './dto/reject-contract.dto';
import { ValidateContractDto } from './dto/validate-contract.dto';

@Injectable()
export class ContractsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async createOwnerDraft(user: AuthenticatedUser, dto: CreateOwnerDraftDto) {
    const defaultParties = getDefaultParties(this.configService);

    const ownerParty = this.requireUserParty(
      user,
      'Authenticated owner user does not have a linked Daml partyId',
    );

    return this.damlClient.createContract({
      templateId: TEMPLATE_IDS.OwnerSubmittedManagedContractDraft,
      payload: {
        owner: ownerParty,
        easycoin: defaultParties.easycoin,
        legalAdmin: defaultParties.legalAdmin,
        auditor: defaultParties.auditor,
        paymentVerifier: defaultParties.paymentVerifier,

        contractData: {
          contractId: dto.contractId,
          propertyId: dto.propertyId,
          propertyName: dto.propertyName,
          financialPeriod: dto.financialPeriod,
          expectedRentalIncome: toDamlDecimal(dto.expectedRentalIncome),
          expectedExpenses: toDamlDecimal(dto.expectedExpenses),
          reportFrequency: dto.reportFrequency,
        },

        terms: {
          easycoinFeeRate: toDamlDecimal(dto.easycoinFeeRate),
          ownerProfitShareOffered: toDamlDecimal(dto.ownerProfitShareOffered),
          ownerRetainedShare: toDamlDecimal(dto.ownerRetainedShare),
          expectedInvestorSettlement: toDamlDecimal(
            dto.expectedInvestorSettlement,
          ),
          expectedUpfrontFunding: toDamlDecimal(dto.expectedUpfrontFunding),
          currency: dto.currency,
        },
      },
      actAs: [ownerParty],
    });
  }

  async getOwnerDrafts(user: AuthenticatedUser, party?: string) {
    const readerParty = this.resolveReaderParty(user, party);

    return this.queryOwnerDraftsByParty(readerParty);
  }

  async getValidatedContracts(user: AuthenticatedUser, party?: string) {
    const readerParty = this.resolveReaderParty(user, party);

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ValidatedManagedContract],
      parties: [readerParty],
      limit: 100,
    });
  }

  async validateContract(
    user: AuthenticatedUser,
    businessContractId: string,
    _dto: ValidateContractDto,
  ) {
    const easycoin = this.requireUserParty(
      user,
      'Authenticated Easycoin user does not have a linked Daml partyId',
    );

    const drafts = await this.queryOwnerDraftsByParty(easycoin);

    const draft = findByPath(
      drafts,
      'contractData.contractId',
      businessContractId,
    );

    if (!draft) {
      throw new NotFoundException({
        message: 'Owner submitted draft not found',
        businessContractId,
      });
    }

    return this.damlClient.exerciseChoice({
      templateId: TEMPLATE_IDS.OwnerSubmittedManagedContractDraft,
      contractId: draft.contractId,
      choice: 'ValidateByEasycoin',
      argument: {},
      actAs: [easycoin],
    });
  }

  async rejectContract(
    user: AuthenticatedUser,
    businessContractId: string,
    dto: RejectContractDto,
  ) {
    const easycoin = this.requireUserParty(
      user,
      'Authenticated Easycoin user does not have a linked Daml partyId',
    );

    const drafts = await this.queryOwnerDraftsByParty(easycoin);

    const draft = findByPath(
      drafts,
      'contractData.contractId',
      businessContractId,
    );

    if (!draft) {
      throw new NotFoundException({
        message: 'Owner submitted draft not found',
        businessContractId,
      });
    }

    return this.damlClient.exerciseChoice({
      templateId: TEMPLATE_IDS.OwnerSubmittedManagedContractDraft,
      contractId: draft.contractId,
      choice: 'RejectByEasycoin',
      argument: {
        reason: dto.reason,
      },
      actAs: [easycoin],
    });
  }

  private async queryOwnerDraftsByParty(party: string) {
    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.OwnerSubmittedManagedContractDraft],
      parties: [party],
      limit: 100,
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
