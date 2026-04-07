export interface ApiError {
  message: string
  statusCode: number
  details?: unknown
}

export const getApiBaseUrls = () => {
  const config = useRuntimeConfig()

  return {
    usersBaseUrl: config.public.usersApiUrl,
    securityBaseUrl: config.public.securityApiUrl,
    reservationsBaseUrl: config.public.reservationsApiUrl,
    searchBaseUrl: config.public.searchApiUrl
  }
}

export const handleApiError = (error: unknown): ApiError => {
  const err = error as {
    statusCode?: number
    data?: unknown
  }

  const errorMap: Record<number, string> = {
    400: 'errors.validation',
    401: 'errors.unauthorized',
    403: 'errors.forbidden',
    404: 'errors.notFound',
    409: 'errors.conflict',
    500: 'errors.serverError'
  }

  const statusCode = err.statusCode || 0
  const message = errorMap[statusCode] || 'errors.unknown'

  return {
    message,
    statusCode,
    details: err.data
  }
}
