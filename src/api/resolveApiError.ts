import type { AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/api/types/apiErrorResponse'

export function resolveApiError(error: unknown): string {
  if (!isAxiosError(error)) {
    return '系統發生未知錯誤'
  }

  const data = error.response?.data
  if (isApiErrorResponse(data)) {
    return data.error
  }

  return '系統發生錯誤，請稍後再試'
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error
}

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    (data as { success: unknown }).success === false &&
    'error' in data &&
    typeof (data as { error: unknown }).error === 'string'
  )
}
