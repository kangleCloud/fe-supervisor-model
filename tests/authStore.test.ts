import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as authApi from '@/api/auth/authApi';
import { useAuthStore } from '@/stores/auth/useAuthStore';

vi.mock('@/api/auth/authApi', () => ({
  login: vi.fn(),
  getMe: vi.fn(),
  logout: vi.fn(),
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('persists the token after login', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'token-1',
      tokenType: 'Bearer',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: {
        username: 'ops',
        displayName: 'Ops User',
        roles: ['admin'],
        permissions: ['supervisor:write'],
      },
    });

    const authStore = useAuthStore();
    await authStore.login({ username: 'ops', password: 'secret' });

    expect(authStore.isAuthenticated).toBe(true);
    expect(window.localStorage.getItem('supervisor_access_token')).toBe('token-1');
  });

  it('restores a valid token and fetches current user', async () => {
    window.localStorage.setItem('supervisor_access_token', 'token-2');
    window.localStorage.setItem('supervisor_token_expires_at', '2099-01-01T00:00:00.000Z');
    vi.mocked(authApi.getMe).mockResolvedValue({
      username: 'ops',
      displayName: 'Ops User',
      roles: ['admin'],
      permissions: ['supervisor:read'],
    });

    const authStore = useAuthStore();
    await authStore.initialize();

    expect(authStore.isAuthenticated).toBe(true);
    expect(authStore.user?.username).toBe('ops');
  });

  it('clears an expired token during initialization', async () => {
    window.localStorage.setItem('supervisor_access_token', 'token-3');
    window.localStorage.setItem('supervisor_token_expires_at', '2020-01-01T00:00:00.000Z');

    const authStore = useAuthStore();
    await authStore.initialize();

    expect(authStore.isAuthenticated).toBe(false);
    expect(window.localStorage.getItem('supervisor_access_token')).toBeNull();
  });
});
