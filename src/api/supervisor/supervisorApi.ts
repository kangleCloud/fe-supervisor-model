import { request } from '@/api/http/httpClient';
import { ADMIN_API_PREFIX } from '@/api/http/apiPrefix';
import type {
  ArchiveActionResponse,
  CommandResultCollection,
  CommandStep,
  ImportMode,
  ImportReport,
  ImportStagingResponse,
  OperationCommandPayload,
  PagedServiceResponse,
  RuntimeActionResponse,
  ServiceCreatePayload,
  ServiceCreateResponse,
  ServiceDeleteResponse,
  ServiceListQuery,
  ServiceUpdatePayload,
  ServiceUpdateResponse,
  ServiceSyncResponse,
  StatusRefreshResponse,
  SupervisorHost,
  SupervisorOverviewResponse,
  SupervisorServiceDetail,
} from '@/api/supervisor/supervisor.types';

const SUPERVISOR = `${ADMIN_API_PREFIX}/supervisor`;

interface RawSupervisorOverviewResponse {
  host: string;
  hostName: string;
  executorType: string;
  available: boolean;
  connectionState: 'CONNECTED' | 'UNREACHABLE' | 'UNSUPPORTED';
  collectedAt: string;
  cpu: {
    usagePercent: number;
  };
  memory: {
    usagePercent: number;
    usedBytes: number;
    totalBytes: number;
    usedText: string;
    totalText: string;
  };
  checks: {
    supervisorctlAvailable: boolean;
    confDirReadable: boolean;
  };
  warnings: string[];
}

interface RawServiceListRecord {
  id: number;
  host: string;
  hostIp?: string;
  jobName: string | null;
  moduleName: string | null;
  contentProgramName: string;
  programName?: string;
  configPath: string;
  fileName: string;
  configName?: string;
  manageMode: 'TEMPLATE_MANAGED' | 'IMPORTED_READONLY';
  metadataComplete: boolean;
  parseWarnings: string[];
  javaPath: string | null;
  active: string | null;
  port: number | null;
  jarName: string | null;
  xms: string | null;
  xmx: string | null;
  user: string | null;
  status: string | null;
  pid: string | null;
  uptime: string | null;
  updateTime: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  restoredAt: string | null;
}

interface RawPagedServiceResponse {
  records: RawServiceListRecord[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
}

interface RawSupervisorServiceDetail {
  id: number;
  host: string;
  hostName: string;
  contentProgramName: string;
  programName?: string;
  configPath: string;
  fileName: string;
  configName?: string;
  manageMode: 'TEMPLATE_MANAGED' | 'IMPORTED_READONLY';
  metadataComplete: boolean;
  parseWarnings: string[];
  jobName: string | null;
  moduleName: string | null;
  javaPath: string | null;
  active: string | null;
  port: number | null;
  jarName: string | null;
  xms: string | null;
  xmx: string | null;
  user: string | null;
  command: string | null;
  directory: string | null;
  stdoutLogfile: string | null;
  status: string | null;
  pid: string | null;
  uptime: string | null;
  hasBackup: boolean;
  configContent: string | null;
  backupConfigContent: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  restoredAt: string | null;
  lastSyncAt: string | null;
  syncStatus: string | null;
  syncError: string | null;
  updatedAt: string | null;
}

interface RawImportItem {
  configPath: string;
  fileName: string;
  contentProgramName: string | null;
  programName?: string | null;
  configName?: string | null;
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
  result: 'PLANNED' | 'IMPORTED' | 'UPDATED' | 'SKIPPED';
  message: string;
}

interface RawImportReport {
  host: string;
  mode: ImportMode;
  batchId: string;
  summary: {
    planned: number;
    imported: number;
    updated: number;
    skipped: number;
  };
  items: RawImportItem[];
}

interface RawImportStagingResponse {
  host: string;
  exists: boolean;
  batchId: string | null;
  createdAt: string | null;
  summary: {
    planned: number;
    imported: number;
    updated: number;
    skipped: number;
  };
  items: RawImportItem[];
}

interface RawServiceSyncResponse {
  host: string;
  contentProgramName: string;
  status: string | null;
  pid: string | null;
  uptime: string | null;
  syncedFields: string[];
  warnings: string[];
  lastSyncAt: string | null;
  syncStatus: string | null;
  syncError: string | null;
  commandResults?: Record<string, unknown>;
}

interface RawRuntimeActionResponse {
  host: string;
  contentProgramName: string;
  action: string;
  status: string | null;
  commandResult?: Record<string, unknown>;
}

interface RawArchiveActionResponse {
  host: string;
  contentProgramName: string;
  isArchived: boolean;
  archivedAt: string | null;
  restoredAt: string | null;
  status: string | null;
  commandResult?: Record<string, unknown>;
  fileResult?: Record<string, unknown>;
}

interface RawServiceUpdateResponse {
  host: string;
  previousContentProgramName: string;
  contentProgramName: string;
  configPath: string;
  fileName: string;
  manageMode: 'TEMPLATE_MANAGED' | 'IMPORTED_READONLY';
  commandResults?: Record<string, unknown>;
}

interface RawServiceDeleteResponse {
  host: string;
  contentProgramName: string;
  deletedConfigPath: string;
  backupPath: string | null;
  commandResults?: Record<string, unknown>;
}

interface RawServiceCreateResponse {
  id: number;
  host: string;
  jobName: string | null;
  moduleName: string | null;
  contentProgramName: string;
  configPath: string;
  fileName: string;
  manageMode: 'TEMPLATE_MANAGED' | 'IMPORTED_READONLY';
  metadataComplete: boolean;
  parseWarnings: string[];
  javaPath: string | null;
  active: string | null;
  port: number | null;
  jarName: string | null;
  xms: string | null;
  xmx: string | null;
  user: string | null;
  status: string | null;
  fileState: string | null;
  commandResults?: Record<string, unknown>;
  isArchived: boolean;
  archivedAt: string | null;
  restoredAt: string | null;
}

function normalizeSupervisorState(value: string | null | undefined) {
  return (value || 'UNKNOWN') as SupervisorServiceDetail['status'];
}

function isCommandStep(value: unknown): value is CommandStep {
  return !!value && typeof value === 'object' && (
    'exitCode' in value
    || 'stdout' in value
    || 'stderr' in value
    || 'backupPath' in value
    || 'configPath' in value
    || 'path' in value
    || 'ok' in value
    || 'exists' in value
  );
}

function normalizeCommandResultCollection(value: Record<string, unknown> | undefined): CommandResultCollection | undefined {
  if (!value) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, isCommandStep(entry) ? entry : null]),
  );
}

function normalizeOperationCommandPayload(value: Record<string, unknown> | undefined): OperationCommandPayload | undefined {
  return normalizeCommandResultCollection(value);
}

function normalizeServiceRecord(record: RawServiceListRecord) {
  return {
    id: record.id,
    host: record.hostIp || record.host,
    jobName: record.jobName,
    moduleName: record.moduleName,
    programName: record.programName || record.contentProgramName,
    configPath: record.configPath,
    fileName: record.fileName,
    manageMode: record.manageMode,
    metadataComplete: record.metadataComplete,
    parseWarnings: record.parseWarnings,
    javaPath: record.javaPath,
    active: record.active,
    port: record.port,
    jarName: record.jarName,
    xms: record.xms,
    xmx: record.xmx,
    user: record.user,
    status: normalizeSupervisorState(record.status),
    pid: record.pid,
    uptime: record.uptime,
    updateTime: record.updateTime,
    isArchived: record.isArchived,
    archivedAt: record.archivedAt,
    restoredAt: record.restoredAt,
  };
}

function normalizeServiceDetail(detail: RawSupervisorServiceDetail): SupervisorServiceDetail {
  return {
    id: detail.id,
    host: detail.host,
    hostName: detail.hostName,
    jobName: detail.jobName,
    moduleName: detail.moduleName,
    programName: detail.programName || detail.contentProgramName,
    configPath: detail.configPath,
    fileName: detail.fileName,
    manageMode: detail.manageMode || 'TEMPLATE_MANAGED',
    metadataComplete: detail.metadataComplete ?? true,
    parseWarnings: detail.parseWarnings || [],
    javaPath: detail.javaPath,
    active: detail.active,
    port: detail.port,
    jarName: detail.jarName,
    xms: detail.xms,
    xmx: detail.xmx,
    user: detail.user,
    status: normalizeSupervisorState(detail.status),
    pid: detail.pid,
    uptime: detail.uptime,
    command: detail.command,
    directory: detail.directory,
    stdoutLogfile: detail.stdoutLogfile,
    hasBackup: detail.hasBackup,
    configContent: detail.configContent,
    backupConfigContent: detail.backupConfigContent,
    lastSyncAt: detail.lastSyncAt,
    syncStatus: detail.syncStatus,
    syncError: detail.syncError,
    isArchived: detail.isArchived,
    archivedAt: detail.archivedAt,
    restoredAt: detail.restoredAt,
    updatedAt: detail.updatedAt,
  };
}

function normalizeImportReport(report: RawImportReport): ImportReport {
  return {
    host: report.host,
    mode: report.mode,
    batchId: report.batchId,
    summary: report.summary,
    items: report.items.map((item) => ({
      configPath: item.configPath,
      fileName: item.fileName,
      programName: item.programName || item.contentProgramName,
      jobName: item.jobName,
      moduleName: item.moduleName,
      javaPath: item.javaPath,
      active: item.active,
      port: item.port,
      jarName: item.jarName,
      xms: item.xms,
      xmx: item.xmx,
      user: item.user,
      manageMode: item.manageMode,
      metadataComplete: item.metadataComplete,
      parseWarnings: item.parseWarnings || [],
      result: item.result,
      message: item.message,
    })),
  };
}

function normalizeImportStagingResponse(response: RawImportStagingResponse): ImportStagingResponse {
  return {
    host: response.host,
    exists: response.exists,
    batchId: response.batchId,
    createdAt: response.createdAt,
    summary: response.summary,
    items: response.items.map((item) => ({
      configPath: item.configPath,
      fileName: item.fileName,
      programName: item.programName || item.contentProgramName,
      jobName: item.jobName,
      moduleName: item.moduleName,
      javaPath: item.javaPath,
      active: item.active,
      port: item.port,
      jarName: item.jarName,
      xms: item.xms,
      xmx: item.xmx,
      user: item.user,
      manageMode: item.manageMode,
      metadataComplete: item.metadataComplete,
      parseWarnings: item.parseWarnings || [],
      result: item.result,
      message: item.message,
    })),
  };
}

function normalizeServiceSyncResponse(response: RawServiceSyncResponse) {
  return {
    host: response.host,
    programName: response.contentProgramName,
    status: normalizeSupervisorState(response.status),
    pid: response.pid,
    uptime: response.uptime,
    syncedFields: response.syncedFields,
    warnings: response.warnings,
    lastSyncAt: response.lastSyncAt,
    syncStatus: response.syncStatus,
    syncError: response.syncError,
    commandResults: normalizeCommandResultCollection(response.commandResults),
  };
}

function normalizeRuntimeActionResponse(response: RawRuntimeActionResponse) {
  return {
    host: response.host,
    programName: response.contentProgramName,
    action: response.action,
    status: normalizeSupervisorState(response.status),
    commandResult: normalizeOperationCommandPayload(response.commandResult),
  };
}

function normalizeArchiveActionResponse(response: RawArchiveActionResponse) {
  return {
    host: response.host,
    programName: response.contentProgramName,
    isArchived: response.isArchived,
    archivedAt: response.archivedAt,
    restoredAt: response.restoredAt,
    status: normalizeSupervisorState(response.status),
    commandResult: normalizeOperationCommandPayload(response.commandResult),
    fileResult: normalizeCommandResultCollection(response.fileResult),
  };
}

function normalizeServiceUpdateResponse(response: RawServiceUpdateResponse) {
  return {
    host: response.host,
    previousProgramName: response.previousContentProgramName,
    programName: response.contentProgramName,
    configPath: response.configPath,
    fileName: response.fileName,
    manageMode: response.manageMode,
    commandResults: normalizeCommandResultCollection(response.commandResults),
  };
}

function normalizeServiceDeleteResponse(response: RawServiceDeleteResponse) {
  return {
    host: response.host,
    programName: response.contentProgramName,
    deletedConfigPath: response.deletedConfigPath,
    backupPath: response.backupPath,
    commandResults: normalizeCommandResultCollection(response.commandResults),
  };
}

function normalizeServiceCreateResponse(response: RawServiceCreateResponse) {
  return {
    id: response.id,
    host: response.host,
    jobName: response.jobName,
    moduleName: response.moduleName,
    programName: response.contentProgramName,
    configPath: response.configPath,
    fileName: response.fileName,
    manageMode: response.manageMode,
    metadataComplete: response.metadataComplete,
    parseWarnings: response.parseWarnings,
    javaPath: response.javaPath,
    active: response.active,
    port: response.port,
    jarName: response.jarName,
    xms: response.xms,
    xmx: response.xmx,
    user: response.user,
    status: response.status ? normalizeSupervisorState(response.status) : null,
    fileState: response.fileState,
    isArchived: response.isArchived,
    archivedAt: response.archivedAt,
    restoredAt: response.restoredAt,
    commandResults: normalizeCommandResultCollection(response.commandResults),
  };
}

export function listHosts() {
  return request<SupervisorHost[]>({
    method: 'get',
    url: `${SUPERVISOR}/hosts`,
  });
}

export async function getSupervisorOverview(host: string) {
  return request<SupervisorOverviewResponse>({
    method: 'get',
    url: `${SUPERVISOR}/overview`,
    params: { host },
  });
}

export async function listServices(params: ServiceListQuery) {
  const response = await request<RawPagedServiceResponse>({
    method: 'get',
    url: `${SUPERVISOR}/services`,
    params,
  });

  return {
    ...response,
    records: response.records.map(normalizeServiceRecord),
  } satisfies PagedServiceResponse;
}

export async function getServiceDetail(host: string, programName: string) {
  const response = await request<RawSupervisorServiceDetail>({
    method: 'get',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}`,
    params: { host },
  });

  return normalizeServiceDetail(response);
}

export async function createService(payload: ServiceCreatePayload) {
  const response = await request<RawServiceCreateResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services`,
    data: payload,
  });

  return normalizeServiceCreateResponse(response) satisfies ServiceCreateResponse;
}

export async function updateService(programName: string, host: string, payload: ServiceUpdatePayload) {
  const response = await request<RawServiceUpdateResponse>({
    method: 'put',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}`,
    params: { host },
    data: payload,
  });

  return normalizeServiceUpdateResponse(response) satisfies ServiceUpdateResponse;
}

export async function deleteService(host: string, programName: string) {
  const response = await request<RawServiceDeleteResponse>({
    method: 'delete',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}`,
    params: { host },
  });

  return normalizeServiceDeleteResponse(response) satisfies ServiceDeleteResponse;
}

export async function startService(host: string, programName: string) {
  const response = await request<RawRuntimeActionResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}/start`,
    params: { host },
  });

  return normalizeRuntimeActionResponse(response) satisfies RuntimeActionResponse;
}

export async function stopService(host: string, programName: string) {
  const response = await request<RawRuntimeActionResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}/stop`,
    params: { host },
  });

  return normalizeRuntimeActionResponse(response) satisfies RuntimeActionResponse;
}

export async function restartService(host: string, programName: string) {
  const response = await request<RawRuntimeActionResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}/restart`,
    params: { host },
  });

  return normalizeRuntimeActionResponse(response) satisfies RuntimeActionResponse;
}

export async function syncService(host: string, programName: string) {
  const response = await request<RawServiceSyncResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}/sync`,
    params: { host },
  });

  return normalizeServiceSyncResponse(response) satisfies ServiceSyncResponse;
}

export async function archiveService(host: string, programName: string) {
  const response = await request<RawArchiveActionResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}/archive`,
    params: { host },
  });

  return normalizeArchiveActionResponse(response) satisfies ArchiveActionResponse;
}

export async function restoreService(host: string, programName: string) {
  const response = await request<RawArchiveActionResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}/restore`,
    params: { host },
  });

  return normalizeArchiveActionResponse(response) satisfies ArchiveActionResponse;
}

export async function importServices(payload: { host: string; mode: ImportMode; batchId?: string }) {
  const response = await request<RawImportReport>({
    method: 'post',
    url: `${SUPERVISOR}/imports`,
    data: payload,
  });

  return normalizeImportReport(response);
}

export async function getImportStaging(host: string) {
  const response = await request<RawImportStagingResponse>({
    method: 'get',
    url: `${SUPERVISOR}/imports/staging`,
    params: { host },
  });

  return normalizeImportStagingResponse(response);
}

export function refreshServiceStatus(host: string) {
  return request<StatusRefreshResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services/status/refresh`,
    params: { host },
  });
}
