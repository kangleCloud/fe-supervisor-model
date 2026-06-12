import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
}));

vi.mock('@/api/http/httpClient', () => ({
  request: mockRequest,
}));

import {
  archiveService,
  createService,
  deleteService,
  getImportStaging,
  getServiceDetail,
  getSupervisorOverview,
  importServices,
  listHosts,
  listServices,
  refreshServiceStatus,
  restartService,
  restoreService,
  startService,
  stopService,
  syncService,
  updateService,
} from '@/api/supervisor/supervisorApi';

describe('supervisorApi URLs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listHosts uses /admin/api/supervisor/hosts', async () => {
    mockRequest.mockResolvedValue([]);
    await listHosts();
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/admin/api/supervisor/hosts' }),
    );
  });

  it('getSupervisorOverview uses /admin/api/supervisor/overview with host query params', async () => {
    mockRequest.mockResolvedValue({});
    await getSupervisorOverview('10.1.0.104');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/overview',
        method: 'get',
        params: { host: '10.1.0.104' },
      }),
    );
  });

  it('listServices uses /admin/api/supervisor/services with paged query params', async () => {
    mockRequest.mockResolvedValue({ records: [], page: 2, pageSize: 20, total: 0, pages: 0 });
    await listServices({
      host: 'host-1',
      keyword: 'demo',
      status: 'RUNNING',
      archived: 'all',
      page: 2,
      pageSize: 20,
    });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services',
        params: {
          host: 'host-1',
          keyword: 'demo',
          status: 'RUNNING',
          archived: 'all',
          page: 2,
          pageSize: 20,
        },
      }),
    );
  });

  it('getServiceDetail encodes programName in /admin/api/supervisor/services/:name', async () => {
    mockRequest.mockResolvedValue({
      id: 1,
      host: 'host-1',
      hostName: 'host-1',
      contentProgramName: 'my-app',
      configPath: 'my-app.ini',
      fileName: 'my-app.ini',
      status: 'RUNNING',
      pid: '1',
      uptime: '1:00',
      hasBackup: false,
      configContent: null,
      backupConfigContent: null,
      isArchived: false,
      archivedAt: null,
      restoredAt: null,
      lastSyncAt: null,
      syncStatus: 'UNKNOWN',
      syncError: null,
      updatedAt: null,
    });
    await getServiceDetail('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app',
        params: { host: 'host-1' },
      }),
    );
  });

  it('importServices PRECHECK uses /admin/api/supervisor/imports', async () => {
    mockRequest.mockResolvedValue({ host: 'host-1', mode: 'PRECHECK', batchId: 'batch-1', summary: {}, items: [] });
    await importServices({ host: 'host-1', mode: 'PRECHECK' });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/imports',
        data: { host: 'host-1', mode: 'PRECHECK' },
      }),
    );
  });

  it('getImportStaging uses /admin/api/supervisor/imports/staging with host query params', async () => {
    mockRequest.mockResolvedValue({
      host: 'host-1',
      exists: false,
      batchId: null,
      createdAt: null,
      summary: { planned: 0, imported: 0, updated: 0, skipped: 0 },
      items: [],
    });
    await getImportStaging('host-1');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/imports/staging',
        method: 'get',
        params: { host: 'host-1' },
      }),
    );
  });

  it('importServices COMMIT sends batchId', async () => {
    mockRequest.mockResolvedValue({ host: 'host-1', mode: 'COMMIT', batchId: 'batch-1', summary: {}, items: [] });
    await importServices({ host: 'host-1', mode: 'COMMIT', batchId: 'batch-1' });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/imports',
        data: { host: 'host-1', mode: 'COMMIT', batchId: 'batch-1' },
      }),
    );
  });

  it('refreshServiceStatus uses /admin/api/supervisor/services/status/refresh', async () => {
    mockRequest.mockResolvedValue({});
    await refreshServiceStatus('host-1');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/status/refresh',
        params: { host: 'host-1' },
      }),
    );
  });

  it('createService uses /admin/api/supervisor/services with backend fields', async () => {
    mockRequest.mockResolvedValue({});
    const payload = {
      host: 'host-1',
      programName: 'app-demo',
      jobName: 'demo',
      moduleName: 'app',
      javaPath: '/usr/local/jdk17/bin/java',
      active: 'prod',
      port: 9001,
      jarName: 'app.jar',
      fileName: '',
      xms: '128m',
      xmx: '128m',
      user: 'root',
    };
    await createService(payload);

    const call = mockRequest.mock.calls[0][0];
    expect(call.url).toBe('/admin/api/supervisor/services');
    expect(call.method).toBe('post');
    expect(call.data).toEqual({
      host: 'host-1',
      contentProgramName: 'app-demo',
      jobName: 'demo',
      moduleName: 'app',
      javaPath: '/usr/local/jdk17/bin/java',
      active: 'prod',
      port: 9001,
      jarName: 'app.jar',
      fileName: '',
      xms: '128m',
      xmx: '128m',
      user: 'root',
    });
    expect(call.data).not.toHaveProperty('autoStart');
    expect(call.data).not.toHaveProperty('configName');
    expect(call.data).not.toHaveProperty('programName');
  });

  it('updateService uses PUT /services/:name with host param and body', async () => {
    mockRequest.mockResolvedValue({
      host: 'host-1',
      previousContentProgramName: 'my-app',
      contentProgramName: 'my-app',
      configPath: 'my-app.ini',
      fileName: 'my-app.ini',
      manageMode: 'TEMPLATE_MANAGED',
      commandResults: {},
    });
    const payload = {
      programName: 'app-demo',
      jobName: 'demo',
      moduleName: 'app',
      javaPath: '/usr/local/jdk17/bin/java',
      active: 'prod',
      port: 9001,
      fileName: '',
    };
    await updateService('my-app', 'host-1', payload);
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app',
        method: 'put',
        params: { host: 'host-1' },
        data: {
          contentProgramName: 'app-demo',
          jobName: 'demo',
          moduleName: 'app',
          javaPath: '/usr/local/jdk17/bin/java',
          active: 'prod',
          port: 9001,
          fileName: '',
        },
      }),
    );
  });

  it('updateService encodes programName with special characters', async () => {
    mockRequest.mockResolvedValue({
      host: 'host-1',
      previousContentProgramName: 'demo/member:v1',
      contentProgramName: 'demo/member:v1',
      configPath: 'demo-member.ini',
      fileName: 'demo-member.ini',
      manageMode: 'TEMPLATE_MANAGED',
      commandResults: {},
    });
    await updateService('demo/member:v1', 'host-1', { programName: 'manual-v1', jobName: 'd', moduleName: 'm', javaPath: '/j', active: 'p', port: 1 });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/demo%2Fmember%3Av1',
        data: expect.objectContaining({ contentProgramName: 'manual-v1' }),
      }),
    );
  });

  it('deleteService uses DELETE /services/:name with host param', async () => {
    mockRequest.mockResolvedValue({
      host: 'host-1',
      contentProgramName: 'my-app',
      deletedConfigPath: 'my-app.ini',
      backupPath: 'my-app.ini.bak',
      commandResults: {},
    });
    await deleteService('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app',
        method: 'delete',
        params: { host: 'host-1' },
      }),
    );
  });

  it('startService uses POST /services/:name/start with host in query params', async () => {
    mockRequest.mockResolvedValue({ host: 'host-1', contentProgramName: 'my-app', action: 'start', status: 'RUNNING', commandResult: {} });
    await startService('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app/start',
        method: 'post',
        params: { host: 'host-1' },
      }),
    );
  });

  it('stopService uses POST /services/:name/stop with host in query params', async () => {
    mockRequest.mockResolvedValue({ host: 'host-1', contentProgramName: 'my-app', action: 'stop', status: 'STOPPED', commandResult: {} });
    await stopService('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app/stop',
        method: 'post',
        params: { host: 'host-1' },
      }),
    );
  });

  it('restartService uses POST /services/:name/restart with host in query params', async () => {
    mockRequest.mockResolvedValue({ host: 'host-1', contentProgramName: 'my-app', action: 'restart', status: 'RUNNING', commandResult: {} });
    await restartService('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app/restart',
        method: 'post',
        params: { host: 'host-1' },
      }),
    );
  });

  it('archiveService uses POST /services/:name/archive with host in query params', async () => {
    mockRequest.mockResolvedValue({ host: 'host-1', contentProgramName: 'my-app', isArchived: true, archivedAt: null, restoredAt: null, status: 'STOPPED', commandResult: {}, fileResult: {} });
    await archiveService('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app/archive',
        method: 'post',
        params: { host: 'host-1' },
      }),
    );
  });

  it('restoreService uses POST /services/:name/restore with host in query params', async () => {
    mockRequest.mockResolvedValue({ host: 'host-1', contentProgramName: 'my-app', isArchived: false, archivedAt: null, restoredAt: null, status: 'STOPPED', commandResult: {}, fileResult: {} });
    await restoreService('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app/restore',
        method: 'post',
        params: { host: 'host-1' },
      }),
    );
  });

  it('syncService uses POST /services/:name/sync with host in query params', async () => {
    mockRequest.mockResolvedValue({
      host: 'host-1',
      contentProgramName: 'my-app',
      status: 'RUNNING',
      pid: '1',
      uptime: '0:00:10',
      syncedFields: ['configContent'],
      warnings: [],
      lastSyncAt: '2026-06-12 10:00:00',
      syncStatus: 'SUCCESS',
      syncError: null,
      commandResults: {},
    });
    await syncService('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app/sync',
        method: 'post',
        params: { host: 'host-1' },
      }),
    );
  });

  it('listServices passes archived=false when provided', async () => {
    mockRequest.mockResolvedValue({ records: [], page: 1, pageSize: 10, total: 0, pages: 0 });
    await listServices({ host: 'host-1', archived: 'false', page: 1, pageSize: 10 });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ archived: 'false' }),
      }),
    );
  });

  it('listServices omits archived param when not provided', async () => {
    mockRequest.mockResolvedValue({ records: [], page: 1, pageSize: 10, total: 0, pages: 0 });
    await listServices({ host: 'host-1', page: 1, pageSize: 10 });
    const call = mockRequest.mock.calls[0][0];
    expect(call.params).not.toHaveProperty('archived');
  });
});
