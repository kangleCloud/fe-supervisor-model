import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
}));

vi.mock('@/api/http/httpClient', () => ({
  request: mockRequest,
}));

import {
  listHosts,
  listServices,
  getServiceDetail,
  importServices,
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

  it('listServices uses /admin/api/supervisor/services with host param', async () => {
    mockRequest.mockResolvedValue([]);
    await listServices('host-1');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/services',
        params: { host: 'host-1' },
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
});
