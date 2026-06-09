import axios, { type AxiosRequestConfig } from 'axios';

import { getStoredAccessToken } from '@/stores/auth/tokenStorage';
import { ApiError, type ApiResponse, toApiError } from '@/api/http/types';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
    skipUnauthorizedHandler?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    skipAuth?: boolean;
    skipUnauthorizedHandler?: boolean;
  }
}

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 300000),
});

let unauthorizedHandler: (() => Promise<void> | void) | null = null;

httpClient.interceptors.request.use((config) => {
  if (!config.skipAuth) {
    const accessToken = getStoredAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse<unknown>;

    if (typeof payload?.code === 'number' && payload.code !== 200) {
      throw new ApiError(payload.msg || '请求失败', {
        status: response.status,
        code: payload.code,
        data: payload.data,
      });
    }

    return response;
  },
  async (error) => {
    const apiError = toApiError(error);

    if (error.response?.status === 401 && !error.config?.skipUnauthorizedHandler) {
      await unauthorizedHandler?.();
    }

    return Promise.reject(apiError);
  },
);

export function registerUnauthorizedHandler(handler: () => Promise<void> | void) {
  unauthorizedHandler = handler;
}

export async function request<T>(config: AxiosRequestConfig) {
  const response = await httpClient.request<ApiResponse<T>>(config);
  return response.data.data;
}

export { httpClient };
