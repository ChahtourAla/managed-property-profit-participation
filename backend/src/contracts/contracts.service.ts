import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DamlClientService } from '../daml/daml-client/daml-client.service';
import { TEMPLATE_IDS } from '../daml/template-ids';
import { getDefaultParties } from '../daml/parties';
import { findByPath, toDamlDecimal } from '../daml/daml.utils';

import { CreateOwnerDraftDto } from './dto/create-owner-draft.dto';
import { ValidateContractDto } from './dto/validate-contract.dto';
import { RejectContractDto } from './dto/reject-contract.dto';

@Injectable()
export class ContractsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async createOwnerDraft(dto: CreateOwnerDraftDto) {
    const defaultParties = getDefaultParties(this.configService);

    const owner = dto.owner || defaultParties.owner;
    const easycoin = dto.easycoin || defaultParties.easycoin;
    const legalAdmin = dto.legalAdmin || defaultParties.legalAdmin;
    const auditor = dto.auditor || defaultParties.auditor;
    const paymentVerifier =
      dto.paymentVerifier || defaultParties.paymentVerifier;

    const payload = {
      owner,
      easycoin,
      legalAdmin,
      auditor,
      paymentVerifier,
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
    };

    return this.damlClient.createContract({
      templateId: TEMPLATE_IDS.OwnerSubmittedManagedContractDraft,
      payload,
      actAs: [owner],
      readAs: [easycoin, legalAdmin, auditor, paymentVerifier],
    });
  }

  async getOwnerDrafts(party?: string) {
    const defaultParties = getDefaultParties(this.configService);
    const readerParty = party || defaultParties.easycoin;

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.OwnerSubmittedManagedContractDraft],
      parties: [readerParty],
      limit: 100,
    });
  }

  async getValidatedContracts(party?: string) {
    const defaultParties = getDefaultParties(this.configService);
    const readerParty = party || defaultParties.easycoin;

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ValidatedManagedContract],
      parties: [readerParty],
      limit: 100,
    });
  }

  async validateContract(businessContractId: string, dto: ValidateContractDto) {
    const defaultParties = getDefaultParties(this.configService);
    const easycoin = dto.easycoin || defaultParties.easycoin;

    const drafts = await this.getOwnerDrafts(easycoin);

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

  async rejectContract(businessContractId: string, dto: RejectContractDto) {
    const defaultParties = getDefaultParties(this.configService);
    const easycoin = dto.easycoin || defaultParties.easycoin;

    const drafts = await this.getOwnerDrafts(easycoin);

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
}
