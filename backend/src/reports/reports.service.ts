import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { DamlClientService } from '../daml/daml-client/daml-client.service';
import { filterByPath, findByPath, toDamlDecimal } from '../daml/daml.utils';
import { getDefaultParties } from '../daml/parties';
import { TEMPLATE_IDS } from '../daml/template-ids';

import { AcceptReportDto } from './dto/accept-report.dto';
import { CreatePerformanceReportDto } from './dto/create-performance-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async createPerformanceReport(
    user: AuthenticatedUser,
    dto: CreatePerformanceReportDto,
  ) {
    if (!user.partyId) {
      throw new BadRequestException(
        'Authenticated Easycoin user does not have a linked Daml partyId',
      );
    }

    const easycoin = user.partyId;

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
        message: 'Tokenized instrument not found',
        instrumentId: dto.instrumentId,
      });
    }

    return this.damlClient.exerciseChoice({
      templateId: TEMPLATE_IDS.TokenizedInstrument,
      contractId: instrument.contractId,
      choice: 'RecordPerformanceReport',
      argument: {
        periodLabel: dto.periodLabel,
        rentalIncome: toDamlDecimal(dto.rentalIncome),
        expenses: toDamlDecimal(dto.expenses),
        estimatedNetProfit: toDamlDecimal(dto.estimatedNetProfit),
        reportUri: dto.reportUri,
        reportHash: dto.reportHash,
        isFinal: dto.isFinal,
      },
      actAs: [easycoin],
    });
  }

  async getReports(user: AuthenticatedUser, party?: string) {
    const readerParty = this.resolveReaderParty(user, party);

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.PerformanceReport],
      parties: [readerParty],
      limit: 100,
    });
  }

  async getAcceptedReports(user: AuthenticatedUser, party?: string) {
    const readerParty = this.resolveReaderParty(user, party);

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ReportAccepted],
      parties: [readerParty],
      limit: 100,
    });
  }

  async getReportsByInstrument(
    user: AuthenticatedUser,
    instrumentId: string,
    party?: string,
  ) {
    const reports = await this.getReports(user, party);

    return filterByPath(reports, 'instrumentId', instrumentId);
  }

  async acceptReport(
    user: AuthenticatedUser,
    reportCid: string,
    _dto: AcceptReportDto,
  ) {
    if (!user.partyId) {
      throw new BadRequestException(
        'Authenticated auditor user does not have a linked Daml partyId',
      );
    }

    const auditor = user.partyId;

    const reports = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.PerformanceReport],
      parties: [auditor],
      limit: 100,
    });

    const report = reports.find((item) => item.contractId === reportCid);

    if (!report) {
      throw new NotFoundException({
        message: 'PerformanceReport not found',
        reportCid,
      });
    }

    return this.damlClient.exerciseChoice({
      templateId: TEMPLATE_IDS.PerformanceReport,
      contractId: reportCid,
      choice: 'AcceptReport',
      argument: {},
      actAs: [auditor],
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
}
