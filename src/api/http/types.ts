import type { AxiosError } from 'axios';

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export class ApiError extends Error {
  status?: number;
  code?: number;
  data?: unknown;

  constructor(message: string, options?: { status?: number; code?: number; data?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.code = options?.code;
    this.data = options?.data;
  }
}

export function toApiError(error: AxiosError<ApiResponse<unknown>> | Error) {
  if ('isAxiosError' in error && error.isAxiosError) {
    const response = error.response?.data;
    return new ApiError(response?.msg ?? error.message, {
      status: error.response?.status,
      code: response?.code,
      data: response?.data,
    });
  }

  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError(error.message);
}
