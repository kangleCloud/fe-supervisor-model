import { request } from '@/api/http/httpClient';
import { ADMIN_API_PREFIX } from '@/api/http/apiPrefix';
import type {
  HostPayload,
  PortCheckResult,
  ServiceUpsertPayload,
  SupervisorHost,
  SupervisorServiceDetail,
  SupervisorServiceRecord,
  SupervisorStatus,
} from '@/api/supervisor/supervisor.types';

export function listHosts() {
  return request<SupervisorHost[]>({
    method: 'get',
    url: `${ADMIN_API_PREFIX}/supervisor/hosts`,
  });
}

export function listServices(host: string) {
  return request<SupervisorServiceRecord[]>({
    method: 'get',
    url: `${ADMIN_API_PREFIX}/supervisor/services`,
    params: { host },
  });
}

export function getServiceDetail(host: string, programName: string) {
  return request<SupervisorServiceDetail>({
    method: 'get',
    url: `${ADMIN_API_PREFIX}/supervisor/services/${encodeURIComponent(programName)}`,
    params: { host },
  });
}

export function createService(payload: ServiceUpsertPayload) {
  return request({
    method: 'post',
    url: `${ADMIN_API_PREFIX}/supervisor/services`,
    data: payload,
  });
}

export function updateService(programName: string, payload: ServiceUpsertPayload) {
  return request({
    method: 'put',
    url: `${ADMIN_API_PREFIX}/supervisor/services/${encodeURIComponent(programName)}`,
    data: payload,
  });
}

export function deleteService(host: string, programName: string, deleteBackup = false) {
  return request({
    method: 'delete',
    url: `${ADMIN_API_PREFIX}/supervisor/services/${encodeURIComponent(programName)}`,
    params: { host, deleteBackup },
  });
}

export function startService(payload: HostPayload, programName: string) {
  return request({
    method: 'post',
    url: `${ADMIN_API_PREFIX}/supervisor/services/${encodeURIComponent(programName)}/start`,
    data: payload,
  });
}

export function stopService(payload: HostPayload, programName: string) {
  return request({
    method: 'post',
    url: `${ADMIN_API_PREFIX}/supervisor/services/${encodeURIComponent(programName)}/stop`,
    data: payload,
  });
}

export function restartService(payload: HostPayload, programName: string) {
  return request({
    method: 'post',
    url: `${ADMIN_API_PREFIX}/supervisor/services/${encodeURIComponent(programName)}/restart`,
    data: payload,
  });
}

export function backupService(payload: HostPayload, programName: string) {
  return request({
    method: 'post',
    url: `${ADMIN_API_PREFIX}/supervisor/services/${encodeURIComponent(programName)}/backup`,
    data: payload,
  });
}

export function restoreService(payload: HostPayload, programName: string) {
  return request({
    method: 'post',
    url: `${ADMIN_API_PREFIX}/supervisor/services/${encodeURIComponent(programName)}/restore`,
    data: payload,
  });
}

export function checkPort(host: string, port: number, excludeConfig?: string) {
  return request<PortCheckResult>({
    method: 'get',
    url: `${ADMIN_API_PREFIX}/supervisor/ports/check`,
    params: {
      host,
      port,
      excludeConfig,
    },
  });
}

export function reread(payload: HostPayload) {
  return request({
    method: 'post',
    url: `${ADMIN_API_PREFIX}/supervisor/reread`,
    data: payload,
  });
}

export function update(payload: HostPayload) {
  return request({
    method: 'post',
    url: `${ADMIN_API_PREFIX}/supervisor/update`,
    data: payload,
  });
}

export function getStatus(host: string, programName?: string) {
  return request<SupervisorStatus[]>({
    method: 'get',
    url: `${ADMIN_API_PREFIX}/supervisor/status`,
    params: {
      host,
      programName,
    },
  });
}
