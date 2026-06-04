import { request } from '@/api/http/httpClient';
import type { AuthUser, LoginPayload, LoginResult } from '@/api/auth/auth.types';

export function login(payload: LoginPayload) {
  return request<LoginResult>({
    method: 'post',
    url: '/admin/api/auth/login',
    data: payload,
    skipAuth: true,
    skipUnauthorizedHandler: true,
  });
}

export function getCurrentUser() {
  return request<AuthUser>({
    method: 'get',
    url: '/admin/api/auth/profile',
    skipUnauthorizedHandler: true,
  });
}

export function logout() {
  return request<void>({
    method: 'post',
    url: '/admin/api/auth/logout',
    skipUnauthorizedHandler: true,
  });
}
