import type { FetchError } from 'ofetch'

const DEFAULT_ERROR = 'An unexpected error occurred'

export function getApiErrorMessage(error: unknown, fallback?: string): string {
  const fe = error as FetchError
  const detail = fe?.data?.detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail.map((d: { msg: string }) => d.msg).join(', ')
  }

  return fallback ?? DEFAULT_ERROR
}
