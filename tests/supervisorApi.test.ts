import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
}));

vi.mock('@/api/http/httpClient', () => ({
  request: mockRequest,
}));

import {
  createService,
  getServiceDetail,
  importServices,
  listHosts,
  listServices,
  refreshServiceStatus,
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
});
