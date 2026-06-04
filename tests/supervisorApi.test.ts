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
  checkPort,
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

  it('listServices uses /admin/api/supervisor/services', async () => {
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

  it('checkPort uses /admin/api/supervisor/ports/check', async () => {
    mockRequest.mockResolvedValue({ conflicts: [] });
    await checkPort('host-1', 8080);
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/api/supervisor/ports/check',
        params: expect.objectContaining({ host: 'host-1', port: 8080 }),
      }),
    );
  });
});
