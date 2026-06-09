export interface SupervisorHost {
  name: string;
  ip: string;
  enabled: boolean;
  executorType: string;
  ansiblePattern: string | null;
}

export interface SupervisorStatus {
  program_name: string;
  state: string;
  raw: string;
}

export type ManageMode = 'TEMPLATE_MANAGED' | 'IMPORTED_READONLY';

export type FileState = 'MATCH' | 'MISSING' | 'MISMATCH';

export interface SupervisorServiceRecord {
  id: number;
  host: string;
  jobName: string | null;
  moduleName: string | null;
  programName: string;
  configName: string;
  configPath: string;
  fileName: string;
  contentProgramName: string;
  manageMode: ManageMode;
  metadataComplete: boolean;
  parseWarnings: string[];
  javaPath: string | null;
  active: string | null;
  port: number | null;
  jarName: string | null;
  xms: string | null;
  xmx: string | null;
  user: string | null;
  status: SupervisorStatus | null;
  fileState: FileState;
}

export interface SupervisorServiceDetail extends SupervisorServiceRecord {
  expectedContent: string;
  remoteContent?: string;
}

export interface ServiceCreatePayload {
  host: string;
  jobName: string;
  moduleName: string;
  javaPath: string;
  active: string;
  port: number;
  jarName?: string;
  configName?: string;
  xms?: string;
  xmx?: string;
  user?: string;
}

export type ImportMode = 'DRY_RUN' | 'APPLY';

export type ImportResultStatus = 'PLANNED' | 'IMPORTED' | 'UPDATED' | 'SKIPPED';

export interface ImportSummary {
  planned: number;
  imported: number;
  updated: number;
  skipped: number;
}

export interface ImportItem {
  configPath: string;
  fileName: string;
  contentProgramName: string | null;
  programName: string | null;
  configName: string | null;
  jobName: string | null;
  moduleName: string | null;
  javaPath: string | null;
  active: string | null;
  port: number | null;
  jarName: string | null;
  xms: string | null;
  xmx: string | null;
  user: string | null;
  manageMode: string | null;
  metadataComplete: boolean;
  parseWarnings: string[];
  result: ImportResultStatus;
  message: string;
}

export interface ImportReport {
  host: string;
  mode: ImportMode;
  summary: ImportSummary;
  items: ImportItem[];
}
