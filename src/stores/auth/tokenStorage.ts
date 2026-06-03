import {
  ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY,
  ACCESS_TOKEN_STORAGE_KEY,
} from '@/app/storageKeys';

export interface StoredSession {
  accessToken: string;
  expiresAt: string;
}

export function getStoredAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || '';
}

export function getStoredSession(): StoredSession | null {
  const accessToken = getStoredAccessToken();
  const expiresAt = window.localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY) || '';

  if (!accessToken || !expiresAt) {
    return null;
  }

  return {
    accessToken,
    expiresAt,
  };
}

export function persistSession(session: StoredSession) {
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, session.accessToken);
  window.localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY, session.expiresAt);
}

export function clearStoredSession() {
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY);
}

export function isTokenExpired(expiresAt: string, now = Date.now()) {
  const expiresAtMs = Date.parse(expiresAt);

  if (Number.isNaN(expiresAtMs)) {
    return true;
  }

  return expiresAtMs <= now;
}
