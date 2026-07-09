import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DamlClientService } from '../daml/daml-client/daml-client.service';
import { TEMPLATE_IDS } from '../daml/template-ids';
import { getDefaultParties } from '../daml/parties';
import { filterByPath, findByPath, toDamlDecimal } from '../daml/daml.utils';

import { CreatePerformanceReportDto } from './dto/create-performance-report.dto';
import { AcceptReportDto } from './dto/accept-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly damlClient: DamlClientService,
    private readonly configService: ConfigService,
  ) {}

  async createPerformanceReport(dto: CreatePerformanceReportDto) {
    const defaultParties = getDefaultParties(this.configService);
    const easycoin = dto.easycoin || defaultParties.easycoin;

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

  async acceptReport(reportCid: string, dto: AcceptReportDto) {
    const defaultParties = getDefaultParties(this.configService);
    const auditor = dto.auditor || defaultParties.auditor;

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
      choice: 'AuditorAcceptReport',
      argument: {},
      actAs: [auditor],
    });
  }

  async getReportsByInstrument(instrumentId: string, party?: string) {
    const defaultParties = getDefaultParties(this.configService);
    const readerParty = party || defaultParties.easycoin;

    const reports = await this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.PerformanceReport],
      parties: [readerParty],
      limit: 100,
    });

    return filterByPath(reports, 'instrumentId', instrumentId);
  }

  async getReports(party?: string) {
    const defaultParties = getDefaultParties(this.configService);
    const readerParty = party || defaultParties.easycoin;

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.PerformanceReport],
      parties: [readerParty],
      limit: 100,
    });
  }

  async getAcceptedReports(party?: string) {
    const defaultParties = getDefaultParties(this.configService);
    const readerParty = party || defaultParties.auditor;

    return this.damlClient.queryActiveContracts({
      templateIds: [TEMPLATE_IDS.ReportAccepted],
      parties: [readerParty],
      limit: 100,
    });
  }
}
