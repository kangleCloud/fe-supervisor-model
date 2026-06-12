import type {
  ServiceCreatePayload,
  ServiceUpdatePayload,
  SupervisorServiceDetail,
  ServiceListRecord,
} from '@/api/supervisor/supervisor.types';

export function createEmptyServiceDraft(host: string): ServiceCreatePayload {
  return {
    host,
    programName: '',
    jobName: '',
    moduleName: '',
    javaPath: '/usr/local/jdk17/bin/java',
    active: 'prod',
    port: 9001,
    jarName: '',
    fileName: '',
    xms: '128m',
    xmx: '128m',
    user: 'root',
  };
}

export function createEditDraft(source: SupervisorServiceDetail | ServiceListRecord): ServiceUpdatePayload {
  return {
    programName: source.programName,
    jobName: source.jobName || '',
    moduleName: source.moduleName || '',
    javaPath: source.javaPath || '',
    active: source.active || '',
    port: source.port || 9001,
    jarName: source.jarName || '',
    fileName: source.fileName,
    xms: source.xms || '128m',
    xmx: source.xmx || '128m',
    user: source.user || 'root',
  };
}
