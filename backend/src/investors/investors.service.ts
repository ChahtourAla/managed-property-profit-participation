import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DamlClientService } from '../daml/daml-client/daml-client.service';
import { TEMPLATE_IDS } from '../daml/template-ids';
import { getDefaultParties } from '../daml/parties';

import { ApproveInvestorDto } from './dto/approve-investor.dto';

@Injectable()
export class InvestorsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async approveInvestor(dto: ApproveInvestorDto) {
    const defaultParties = getDefaultParties(this.configService);

    const easycoin = dto.easycoin || defaultParties.easycoin;
    const legalAdmin = dto.legalAdmin || defaultParties.legalAdmin;

    const payload = {
      easycoin,
      legalAdmin,
      investor: dto.investor,
      approvalReference: dto.approvalReference,
    };

    return this.damlClient.createContract({
      templateId: TEMPLATE_IDS.ApprovedInvestor,
      payload,
      actAs: [easycoin],
      readAs: [legalAdmin, dto.investor],
    });
  }

  async getApprovedInvestors(party?: string) {
    const defaultParties = getDefaultParties(this.configService);
    const readerParty = party || defaultParties.easycoin;

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ApprovedInvestor],
      parties: [readerParty],
      limit: 100,
    });
  }
}
