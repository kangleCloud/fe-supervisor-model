import { describe, expect, it, vi, beforeEach } from 'vitest';

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
  getServiceDetail,
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

  it('listServices uses /admin/api/supervisor/services with paged query params', async () => {
    mockRequest.mockResolvedValue({});
    await listServices({
      host: 'host-1',
      keyword: 'demo',
      status: 'RUNNING',
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
          page: 2,
          pageSize: 20,
        },
      }),
    );
  });

  it('getServiceDetail encodes programName in /admin/api/supervisor/services/:name', async () => {
    mockRequest.mockResolvedValue({});
    await getServiceDetail('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app',
        params: { host: 'host-1' },
      }),
    );
  });

  it('importServices DRY_RUN uses /admin/api/supervisor/imports', async () => {
    mockRequest.mockResolvedValue({});
    await importServices({ host: 'host-1', mode: 'DRY_RUN' });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/imports',
        data: { host: 'host-1', mode: 'DRY_RUN' },
      }),
    );
  });

  it('importServices APPLY uses /admin/api/supervisor/imports', async () => {
    mockRequest.mockResolvedValue({});
    await importServices({ host: 'host-1', mode: 'APPLY' });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/imports',
        data: { host: 'host-1', mode: 'APPLY' },
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

  it('createService uses /admin/api/supervisor/services with only v1-allowed fields', async () => {
    mockRequest.mockResolvedValue({});
    const payload = {
      host: 'host-1',
      jobName: 'demo',
      moduleName: 'app',
      javaPath: '/usr/local/jdk17/bin/java',
      active: 'prod',
      port: 9001,
      jarName: 'app.jar',
      configName: '',
      xms: '128m',
      xmx: '128m',
      user: 'root',
    };
    await createService(payload);

    const call = mockRequest.mock.calls[0][0];
    expect(call.url).toBe('/admin/api/supervisor/services');
    expect(call.method).toBe('post');
    expect(call.data).toEqual(payload);
    expect(call.data).not.toHaveProperty('autoStart');
  });

  it('updateService uses PUT /services/:name with host param and body', async () => {
    mockRequest.mockResolvedValue({});
    const payload = {
      jobName: 'demo',
      moduleName: 'app',
      javaPath: '/usr/local/jdk17/bin/java',
      active: 'prod',
      port: 9001,
    };
    await updateService('my-app', 'host-1', payload);
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app',
        method: 'put',
        params: { host: 'host-1' },
        data: payload,
      }),
    );
  });

  it('updateService encodes programName with special characters', async () => {
    mockRequest.mockResolvedValue({});
    await updateService('demo/member:v1', 'host-1', { jobName: 'd', moduleName: 'm', javaPath: '/j', active: 'p', port: 1 });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/demo%2Fmember%3Av1',
      }),
    );
  });

  it('deleteService uses DELETE /services/:name with host param', async () => {
    mockRequest.mockResolvedValue({});
    await deleteService('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app',
        method: 'delete',
        params: { host: 'host-1' },
      }),
    );
  });

  it('startService uses POST /services/:name/start with host in data', async () => {
    mockRequest.mockResolvedValue({});
    await startService('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app/start',
        method: 'post',
        data: { host: 'host-1' },
      }),
    );
  });

  it('stopService uses POST /services/:name/stop with host in data', async () => {
    mockRequest.mockResolvedValue({});
    await stopService('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app/stop',
        method: 'post',
        data: { host: 'host-1' },
      }),
    );
  });

  it('restartService uses POST /services/:name/restart with host in data', async () => {
    mockRequest.mockResolvedValue({});
    await restartService('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app/restart',
        method: 'post',
        data: { host: 'host-1' },
      }),
    );
  });

  it('archiveService uses POST /services/:name/archive with host in data', async () => {
    mockRequest.mockResolvedValue({});
    await archiveService('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app/archive',
        method: 'post',
        data: { host: 'host-1' },
      }),
    );
  });

  it('restoreService uses POST /services/:name/restore with host in data', async () => {
    mockRequest.mockResolvedValue({});
    await restoreService('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app/restore',
        method: 'post',
        data: { host: 'host-1' },
      }),
    );
  });

  it('syncService uses POST /services/:name/sync with host in data', async () => {
    mockRequest.mockResolvedValue({});
    await syncService('host-1', 'my-app');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services/my-app/sync',
        method: 'post',
        data: { host: 'host-1' },
      }),
    );
  });

  it('listServices passes archived=true when provided', async () => {
    mockRequest.mockResolvedValue({});
    await listServices({ host: 'host-1', archived: true, page: 1, pageSize: 10 });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ archived: true }),
      }),
    );
  });

  it('listServices omits archived param when not provided', async () => {
    mockRequest.mockResolvedValue({});
    await listServices({ host: 'host-1', page: 1, pageSize: 10 });
    const call = mockRequest.mock.calls[0][0];
    expect(call.params).not.toHaveProperty('archived');
  });
});
