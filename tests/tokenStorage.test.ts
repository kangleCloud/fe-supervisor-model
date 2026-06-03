import {
  clearStoredSession,
  getStoredSession,
  isTokenExpired,
  persistSession,
} from '@/stores/auth/tokenStorage';

describe('tokenStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists and restores the token snapshot', () => {
    persistSession({
      accessToken: 'abc123',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });

    expect(getStoredSession()).toEqual({
      accessToken: 'abc123',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
  });

  it('clears the token snapshot', () => {
    persistSession({
      accessToken: 'abc123',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });

    clearStoredSession();

    expect(getStoredSession()).toBeNull();
  });

  it('treats invalid or past expiry as expired', () => {
    expect(isTokenExpired('invalid-date')).toBe(true);
    expect(isTokenExpired('2020-01-01T00:00:00.000Z')).toBe(true);
    expect(isTokenExpired('2099-01-01T00:00:00.000Z')).toBe(false);
  });
});
