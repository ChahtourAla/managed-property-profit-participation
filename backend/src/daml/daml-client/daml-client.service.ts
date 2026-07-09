import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

import {
  DamlCommand,
  DamlCreateCommandParams,
  DamlCreatedEvent,
  DamlExerciseCommandParams,
  DamlOffset,
  DamlQueryParams,
  DamlSubmitCommandsParams,
} from '../daml.types';

@Injectable()
export class DamlClientService {
  private readonly logger = new Logger(DamlClientService.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL =
      this.configService.get<string>('DAML_JSON_API_URL') ||
      'http://localhost:7575';

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`Daml JSON API configured at ${baseURL}`);
  }

  async submitCommands(params: DamlSubmitCommandsParams) {
    try {
      const payload = {
        userId:
          this.configService.get<string>('DAML_USER_ID') || 'ledger-api-user',
        commandId: uuidv4(),
        submissionId: uuidv4(),
        actAs: params.actAs,
        readAs: params.readAs || [],
        workflowId: params.workflowId || 'managed-property-workflow',
        commands: params.commands,
      };

      const response = await this.client.post(
        '/v2/commands/submit-and-wait',
        payload,
        {
          headers: this.getAuthHeaders(),
        },
      );

      return response.data;
    } catch (error: unknown) {
      this.handleDamlError(error, 'Daml command submission failed');
    }
  }

  async createContract(params: DamlCreateCommandParams) {
    const command: DamlCommand = {
      CreateCommand: {
        templateId: params.templateId,
        createArguments: params.payload,
      },
    };

    return this.submitCommands({
      actAs: params.actAs,
      readAs: params.readAs,
      commands: [command],
    });
  }

  async exerciseChoice(params: DamlExerciseCommandParams) {
    const command: DamlCommand = {
      ExerciseCommand: {
        templateId: params.templateId,
        contractId: params.contractId,
        choice: params.choice,
        choiceArgument: params.argument,
      },
    };

    return this.submitCommands({
      actAs: params.actAs,
      readAs: params.readAs,
      commands: [command],
    });
  }

  async getLedgerEnd(): Promise<DamlOffset> {
    try {
      const response = await this.client.get('/v2/state/ledger-end', {
        headers: this.getAuthHeaders(),
      });

      return response.data?.offset || 0;
    } catch (error: unknown) {
      this.handleDamlError(error, 'Failed to get ledger end');
    }
  }

  async queryActiveContracts(
    params: DamlQueryParams,
  ): Promise<DamlCreatedEvent[]> {
    try {
      const activeAtOffset = await this.getLedgerEnd();

      const response = await this.client.post(
        `/v2/state/active-contracts?limit=${params.limit || 100}`,
        {
          activeAtOffset,
          eventFormat: {
            filtersByParty: this.buildFiltersByParty(
              params.parties,
              params.templateIds,
            ),
            verbose: true,
          },
        },
        {
          headers: this.getAuthHeaders(),
        },
      );

      return this.extractCreatedEvents(response.data);
    } catch (error: unknown) {
      this.handleDamlError(error, 'Daml active contract query failed');
    }
  }

  private buildFiltersByParty(parties: string[], templateIds: string[]) {
    return parties.reduce<Record<string, unknown>>((acc, party) => {
      acc[party] = {
        cumulative: templateIds.map((templateId) => ({
          identifierFilter: {
            TemplateFilter: {
              value: {
                templateId,
                includeCreatedEventBlob: false,
              },
            },
          },
        })),
      };

      return acc;
    }, {});
  }

  private extractCreatedEvents(data: unknown): DamlCreatedEvent[] {
    const entries = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.value)
        ? (data as any).value
        : [];

    return entries
      .map((entry) => {
        const raw = entry as any;

        const createdEvent =
          raw?.contractEntry?.JsActiveContract?.createdEvent ||
          raw?.contractEntry?.ActiveContract?.createdEvent ||
          raw?.activeContract?.createdEvent ||
          raw?.createdEvent ||
          raw;

        if (!createdEvent?.contractId) {
          return null;
        }

        return {
          ...createdEvent,
          createArguments:
            createdEvent.createArgument || createdEvent.createArguments || {},
        };
      })
      .filter(Boolean) as DamlCreatedEvent[];
  }

  private getAuthHeaders() {
    const token = this.configService.get<string>('DAML_AUTH_TOKEN');

    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  private handleDamlError(error: unknown, message: string): never {
    if (axios.isAxiosError(error)) {
      this.logger.error(message, JSON.stringify(error.response?.data));

      throw new InternalServerErrorException({
        message,
        details: error.response?.data || error.message,
      });
    }

    this.logger.error(message, String(error));

    throw new InternalServerErrorException({
      message,
      details: String(error),
    });
  }
}
