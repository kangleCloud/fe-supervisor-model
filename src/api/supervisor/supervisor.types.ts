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

export type ManageMode = 'TEMPLATE_MANAGED' | 'IMPORTED_READONLY';
export type ArchivedFilter = 'false' | 'true' | 'all';

export interface ServiceListRecord {
  id: number;
  host: string;
  jobName: string | null;
  moduleName: string | null;
  programName: string;
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
  archived?: ArchivedFilter;
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
  command: string | null;
  directory: string | null;
  stdoutLogfile: string | null;
  hasBackup: boolean;
  configContent: string | null;
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
  fileName?: string;
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
  fileName?: string;
  xms?: string;
  xmx?: string;
  user?: string;
}

export type ImportMode = 'PRECHECK' | 'COMMIT';
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
  programName: string | null;
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
  batchId: string;
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
  exitCode?: number | null;
  stdout?: string;
  stderr?: string;
  backupPath?: string | null;
  configPath?: string | null;
  path?: string | null;
  ok?: boolean;
  exists?: boolean;
  [key: string]: unknown;
}

export interface LegacyCommandResults {
  steps: CommandStep[];
}

export type CommandResultCollection = Record<string, CommandStep | null | undefined>;
export type OperationCommandPayload = LegacyCommandResults | CommandResultCollection | CommandStep;

export interface ServiceSyncResponse {
  host: string;
  programName: string;
  status: SupervisorState;
  pid: string | null;
  uptime: string | null;
  syncedFields: string[];
  warnings: string[];
  lastSyncAt: string | null;
  syncStatus: string | null;
  syncError: string | null;
  commandResults?: CommandResultCollection;
}

export interface RuntimeActionResponse {
  host: string;
  programName: string;
  action: string;
  status: SupervisorState;
  commandResult?: OperationCommandPayload;
}

export interface ArchiveActionResponse {
  host: string;
  programName: string;
  isArchived: boolean;
  archivedAt: string | null;
  restoredAt: string | null;
  status: SupervisorState;
  commandResult?: OperationCommandPayload;
  fileResult?: CommandResultCollection;
}

export interface ServiceUpdateResponse {
  host: string;
  previousProgramName: string;
  programName: string;
  configPath: string;
  fileName: string;
  manageMode: ManageMode;
  commandResults?: CommandResultCollection;
}

export interface ServiceDeleteResponse {
  host: string;
  programName: string;
  deletedConfigPath: string;
  backupPath: string | null;
  commandResults?: CommandResultCollection;
}

export interface ServiceCreateResponse {
  id: number;
  host: string;
  jobName: string | null;
  moduleName: string | null;
  programName: string;
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
  status: SupervisorState | null;
  fileState: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  restoredAt: string | null;
  commandResults?: CommandResultCollection;
}
