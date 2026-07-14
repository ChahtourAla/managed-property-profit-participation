import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { DamlClientService } from '../daml/daml-client/daml-client.service';
import { getDefaultParties } from '../daml/parties';
import { TEMPLATE_IDS } from '../daml/template-ids';

import { ApproveInvestorDto } from './dto/approve-investor.dto';

@Injectable()
export class InvestorsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async approveInvestor(user: AuthenticatedUser, dto: ApproveInvestorDto) {
    const defaultParties = getDefaultParties(this.configService);

    const easycoin = this.requireUserParty(
      user,
      'Authenticated Easycoin user does not have a linked Daml partyId',
    );

    return this.damlClient.createContract({
      templateId: TEMPLATE_IDS.ApprovedInvestor,
      payload: {
        easycoin,
        legalAdmin: defaultParties.legalAdmin,
        investor: dto.investor,
        approvalReference: dto.approvalReference,
      },
      actAs: [easycoin],
    });
  }

  async getApprovedInvestors(user: AuthenticatedUser, party?: string) {
    const readerParty = this.resolveReaderParty(user, party);

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ApprovedInvestor],
      parties: [readerParty],
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
