import { request } from '@/api/http/httpClient';
import { ADMIN_API_PREFIX } from '@/api/http/apiPrefix';
import type {
  ImportMode,
  ImportReport,
  PagedServiceResponse,
  ServiceCreatePayload,
  ServiceListQuery,
  StatusRefreshResponse,
  SupervisorHost,
  SupervisorServiceDetail,
} from '@/api/supervisor/supervisor.types';

export function listHosts() {
  return request<SupervisorHost[]>({
    method: 'get',
    url: `${ADMIN_API_PREFIX}/supervisor/hosts`,
  });
}

export function listServices(params: ServiceListQuery) {
  return request<PagedServiceResponse>({
    method: 'get',
    url: `${ADMIN_API_PREFIX}/supervisor/services`,
    params,
  });
}

export function getServiceDetail(host: string, programName: string) {
  return request<SupervisorServiceDetail>({
    method: 'get',
    url: `${ADMIN_API_PREFIX}/supervisor/services/${encodeURIComponent(programName)}`,
    params: { host },
  });
}

export function createService(payload: ServiceCreatePayload) {
  return request({
    method: 'post',
    url: `${ADMIN_API_PREFIX}/supervisor/services`,
    data: payload,
  });
}

export function importServices(payload: { host: string; mode: ImportMode }) {
  return request<ImportReport>({
    method: 'post',
    url: `${ADMIN_API_PREFIX}/supervisor/imports`,
    data: payload,
  });
}

export function refreshServiceStatus(host: string) {
  return request<StatusRefreshResponse>({
    method: 'post',
    url: `${ADMIN_API_PREFIX}/supervisor/services/status/refresh`,
    params: { host },
  });
}
