import type {
  ServiceUpsertPayload,
  SupervisorServiceDetail,
  SupervisorServiceRecord,
} from '@/api/supervisor/supervisor.types';

function normalizeJarName(jarName: string) {
  return jarName.endsWith('.jar') ? jarName.slice(0, -4) : jarName;
}

function inferModuleName(programName: string, jarName: string) {
  const normalizedJar = normalizeJarName(jarName);

  if (normalizedJar && programName.endsWith(`_${normalizedJar}`)) {
    return normalizedJar;
  }

  const parts = programName.split('_');
  return parts.length > 1 ? parts[parts.length - 1] : normalizedJar || programName;
}

function inferJobName(programName: string, moduleName: string) {
  const suffix = `_${moduleName}`;

  if (moduleName && programName.endsWith(suffix)) {
    return programName.slice(0, -suffix.length) || programName;
  }

  const parts = programName.split('_');
  return parts.length > 1 ? parts.slice(0, -1).join('_') : programName;
}

export function createEmptyServiceDraft(host: string): ServiceUpsertPayload {
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
    autoStart: false,
  };
}

export function buildDraftFromService(
  host: string,
  source: SupervisorServiceDetail | SupervisorServiceRecord,
): ServiceUpsertPayload {
  const parsed = 'parsed' in source ? source.parsed : source;
  const moduleName = inferModuleName(source.programName, parsed.jarName);
  const jobName = inferJobName(source.programName, moduleName);

  return {
    host,
    jobName,
    moduleName,
    javaPath: parsed.javaPath,
    active: parsed.active,
    port: parsed.port,
    jarName: parsed.jarName,
    configName: source.configName,
    xms: parsed.xms,
    xmx: parsed.xmx,
    user: 'root',
    autoStart: false,
  };
}
