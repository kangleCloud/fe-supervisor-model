import type { ServiceCreatePayload } from '@/api/supervisor/supervisor.types';

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
