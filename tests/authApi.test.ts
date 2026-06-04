import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
}));

vi.mock('@/api/http/httpClient', () => ({
  request: mockRequest,
}));

import { login, getCurrentUser, logout } from '@/api/auth/authApi';

describe('authApi URLs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login uses /admin/api/auth/login', async () => {
    mockRequest.mockResolvedValue({});
    await login({ username: 'ops', password: 'secret' });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/admin/api/auth/login' }),
    );
  });

  it('getCurrentUser uses /admin/api/auth/profile', async () => {
    mockRequest.mockResolvedValue({});
    await getCurrentUser();
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/admin/api/auth/profile' }),
    );
  });

  it('logout uses /admin/api/auth/logout', async () => {
    mockRequest.mockResolvedValue({});
    await logout();
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/admin/api/auth/logout' }),
    );
  });
});
