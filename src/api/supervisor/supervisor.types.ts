export interface SupervisorHost {
  name: string;
  ip: string;
  enabled: boolean;
  executorType: string;
  ansiblePattern: string | null;
}

export type SupervisorState =
  | 'RUNNING'
  | 'STOPPED'
  | 'FATAL'
  | 'BACKOFF'
  | 'STARTING'
  | 'STOPPING'
  | 'EXITED'
  | 'UNKNOWN';

export interface SupervisorStatus {
  programName: string;
  state: SupervisorState;
  raw: string;
}

export type ManageMode = 'TEMPLATE_MANAGED' | 'IMPORTED_READONLY';

export interface ServiceListRecord {
  id: number;
  host: string;
  jobName: string | null;
  moduleName: string | null;
  programName: string;
  configName: string;
  configPath: string;
  fileName: string;
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
  status: SupervisorState;
  pid: string | null;
  uptime: string | null;
  updateTime: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  restoredAt: string | null;
  hasBackup: boolean;
}

export interface PagedServiceResponse {
  records: ServiceListRecord[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface ServiceListQuery {
  host?: string;
  keyword?: string;
  status?: SupervisorState;
  archived?: boolean;
  page?: number;
  pageSize?: number;
}

export interface SupervisorServiceDetail {
  id: number;
  host: string;
  hostName: string;
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
  pid: string | null;
  uptime: string | null;
  command: string | null;
  directory: string | null;
  stdoutLogfile: string | null;
  hasBackup: boolean;
  configContent: string;
  backupConfigContent: string | null;
  lastSyncAt: string | null;
  syncStatus: string | null;
  syncError: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  restoredAt: string | null;
  updatedAt: string | null;
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

export interface ServiceUpdatePayload {
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

export interface StatusRefreshResponse {
  host: string;
  total: number;
  updated: number;
  missing: number;
}

export interface CommandStep {
  exitCode: number;
  stdout: string;
  stderr: string;
  backupPath?: string;
}

export interface CommandResults {
  steps: CommandStep[];
}

export interface SyncResponse {
  syncedFields: string[];
  warnings: string[];
  commandResults?: CommandResults;
}

export interface OperationResponse {
  commandResults?: CommandResults;
  syncedFields?: string[];
  warnings?: string[];
}
