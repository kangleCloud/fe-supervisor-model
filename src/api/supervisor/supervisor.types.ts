export interface SupervisorHost {
  name: string;
  ip: string;
  enabled: boolean;
  executorType: string;
  ansiblePattern: string | null;
}

export interface SupervisorStatus {
  program_name: string;
  state: string;
  raw: string;
}

export interface SupervisorServiceRecord {
  configName: string;
  configPath: string;
  programName: string;
  port: number;
  javaPath: string;
  active: string;
  jarName: string;
  xms: string;
  xmx: string;
  options: string[];
  status: SupervisorStatus | null;
}

export interface SupervisorServiceDetail {
  configName: string;
  configPath: string;
  programName: string;
  content: string;
  parsed: {
    programName: string;
    port: number;
    javaPath: string;
    active: string;
    jarName: string;
    xms: string;
    xmx: string;
    options: string[];
  };
  status: SupervisorStatus | null;
}

export interface HostPayload {
  host: string;
}

export interface ServiceUpsertPayload {
  host: string;
  jobName: string;
  moduleName: string;
  javaPath: string;
  active: string;
  port: number;
  jarName: string;
  configName: string;
  xms: string;
  xmx: string;
  user: string;
  autoStart: boolean;
}

export interface PortConflictRecord {
  programName: string;
  configName: string;
  port: number;
  path: string;
}

export interface PortCheckResult {
  host: string;
  port: number;
  conflicts: PortConflictRecord[];
}
