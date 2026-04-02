export const useApi = () => {
  const config = useRuntimeConfig()
  
  const handleApiError = (error: any) => {
    const errorMap: Record<number, string> = {
      400: 'errors.validation',
      401: 'errors.unauthorized',
      403: 'errors.forbidden',
      404: 'errors.notFound',
      409: 'errors.conflict',
      500: 'errors.serverError'
    }
    
    const statusCode = error.statusCode || 0
    const key = errorMap[statusCode] || 'errors.unknown'
    
    return {
      message: key,
      statusCode,
      details: error.data
    }
  }

  return {
    reservationsBaseUrl: config.public.reservationsApiUrl,
    usersBaseUrl: config.public.usersApiUrl,
    securityBaseUrl: config.public.securityApiUrl,
    handleApiError
  }
}
