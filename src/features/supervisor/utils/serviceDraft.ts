import type {
  ServiceCreatePayload,
  SupervisorServiceDetail,
  SupervisorServiceRecord,
} from '@/api/supervisor/supervisor.types';

export function createEmptyServiceDraft(host: string): ServiceCreatePayload {
  return {
    host,
    jobName: '',
    moduleName: '',
    javaPath: '/usr/local/jdk17/bin/java',
    active: 'prod',
    port: 9001,
    jarName: '',
    configName: '',
    xms: '128m',
    xmx: '128m',
    user: 'root',
  };
}

export function buildDraftFromService(
  host: string,
  source: SupervisorServiceDetail | SupervisorServiceRecord,
): ServiceCreatePayload {
  return {
    host,
    jobName: source.jobName || '',
    moduleName: source.moduleName || '',
    javaPath: source.javaPath || '',
    active: source.active || '',
    port: source.port || 9001,
    jarName: source.jarName || '',
    configName: source.configName,
    xms: source.xms || '128m',
    xmx: source.xmx || '128m',
    user: source.user || 'root',
  };
}
