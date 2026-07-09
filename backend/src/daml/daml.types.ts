export type DamlCommand = Record<string, unknown>;

export type DamlOffset = number | string;

export interface DamlSubmitCommandsParams {
  actAs: string[];
  readAs?: string[];
  commands: DamlCommand[];
  workflowId?: string;
}

export interface DamlCreateCommandParams {
  templateId: string;
  payload: Record<string, unknown>;
  actAs: string[];
  readAs?: string[];
}

export interface DamlExerciseCommandParams {
  templateId: string;
  contractId: string;
  choice: string;
  argument: Record<string, unknown>;
  actAs: string[];
  readAs?: string[];
}

export interface DamlQueryParams {
  templateIds: string[];
  parties: string[];
  limit?: number;
}

export interface DamlCreatedEvent {
  contractId: string;
  templateId: string;
  createArguments: Record<string, unknown>;
  createArgument?: Record<string, unknown>;
  witnessParties?: string[];
  signatories?: string[];
  observers?: string[];
  [key: string]: unknown;
}
