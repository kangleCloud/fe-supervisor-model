import { request } from '@/api/http/httpClient';
import { ADMIN_API_PREFIX } from '@/api/http/apiPrefix';
import type {
  ImportMode,
  ImportReport,
  OperationResponse,
  PagedServiceResponse,
  ServiceCreatePayload,
  ServiceListQuery,
  ServiceUpdatePayload,
  StatusRefreshResponse,
  SupervisorHost,
  SupervisorServiceDetail,
  SyncResponse,
} from '@/api/supervisor/supervisor.types';

const SUPERVISOR = `${ADMIN_API_PREFIX}/supervisor`;

export function listHosts() {
  return request<SupervisorHost[]>({
    method: 'get',
    url: `${SUPERVISOR}/hosts`,
  });
}

export function listServices(params: ServiceListQuery) {
  return request<PagedServiceResponse>({
    method: 'get',
    url: `${SUPERVISOR}/services`,
    params,
  });
}

export function getServiceDetail(host: string, programName: string) {
  return request<SupervisorServiceDetail>({
    method: 'get',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}`,
    params: { host },
  });
}

export function createService(payload: ServiceCreatePayload) {
  return request<OperationResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services`,
    data: payload,
  });
}

export function updateService(programName: string, host: string, payload: ServiceUpdatePayload) {
  return request<OperationResponse>({
    method: 'put',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}`,
    params: { host },
    data: payload,
  });
}

export function deleteService(host: string, programName: string) {
  return request<OperationResponse>({
    method: 'delete',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}`,
    params: { host },
  });
}

export function startService(host: string, programName: string) {
  return request<OperationResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}/start`,
    data: { host },
  });
}

export function stopService(host: string, programName: string) {
  return request<OperationResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}/stop`,
    data: { host },
  });
}

export function restartService(host: string, programName: string) {
  return request<OperationResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}/restart`,
    data: { host },
  });
}

export function syncService(host: string, programName: string) {
  return request<SyncResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}/sync`,
    data: { host },
  });
}

export function archiveService(host: string, programName: string) {
  return request<OperationResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}/archive`,
    data: { host },
  });
}

export function restoreService(host: string, programName: string) {
  return request<OperationResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services/${encodeURIComponent(programName)}/restore`,
    data: { host },
  });
}

export function importServices(payload: { host: string; mode: ImportMode }) {
  return request<ImportReport>({
    method: 'post',
    url: `${SUPERVISOR}/imports`,
    data: payload,
  });
}

export function refreshServiceStatus(host: string) {
  return request<StatusRefreshResponse>({
    method: 'post',
    url: `${SUPERVISOR}/services/status/refresh`,
    params: { host },
  });
}
