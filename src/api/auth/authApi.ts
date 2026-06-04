import { request } from '@/api/http/httpClient';
import { ADMIN_API_PREFIX } from '@/api/http/apiPrefix';
import type { AuthUser, LoginPayload, LoginResult } from '@/api/auth/auth.types';

export function login(payload: LoginPayload) {
  return request<LoginResult>({
    method: 'post',
    url: `${ADMIN_API_PREFIX}/auth/login`,
    data: payload,
    skipAuth: true,
    skipUnauthorizedHandler: true,
  });
}

export function getCurrentUser() {
  return request<AuthUser>({
    method: 'get',
    url: `${ADMIN_API_PREFIX}/auth/profile`,
    skipUnauthorizedHandler: true,
  });
}

export function logout() {
  return request<void>({
    method: 'post',
    url: `${ADMIN_API_PREFIX}/auth/logout`,
    skipUnauthorizedHandler: true,
  });
}
