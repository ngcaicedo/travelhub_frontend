import { describe, it, expect } from 'vitest'
import { getApiBaseUrls, handleApiError } from '~/utils/api'

describe('api utils', () => {
  describe('getApiBaseUrls', () => {
    it('returns an object with API URLs', () => {
      const urls = getApiBaseUrls()
      expect(urls).toHaveProperty('usersApiUrl')
      expect(urls).toHaveProperty('securityApiUrl')
      expect(urls).toHaveProperty('reservationsApiUrl')
      expect(urls).toHaveProperty('searchApiUrl')
    })
  })

  describe('handleApiError', () => {
    it('maps 400 to validation error', () => {
      const result = handleApiError({ statusCode: 400 })
      expect(result.message).toBe('errors.validation')
      expect(result.statusCode).toBe(400)
    })

    it('maps 400 unavailable detail to unavailable error', () => {
      const result = handleApiError({
        statusCode: 400,
        data: { detail: 'Room abc is not available for the selected dates' }
      })
      expect(result.message).toBe('errors.unavailable')
      expect(result.statusCode).toBe(400)
    })

    it('maps 401 to unauthorized error', () => {
      const result = handleApiError({ statusCode: 401 })
      expect(result.message).toBe('errors.unauthorized')
    })

    it('maps 403 to forbidden error', () => {
      const result = handleApiError({ statusCode: 403 })
      expect(result.message).toBe('errors.forbidden')
    })

    it('maps 404 to not found error', () => {
      const result = handleApiError({ statusCode: 404 })
      expect(result.message).toBe('errors.notFound')
    })

    it('maps 409 to conflict error', () => {
      const result = handleApiError({ statusCode: 409 })
      expect(result.message).toBe('errors.conflict')
    })

    it('maps 500 to server error', () => {
      const result = handleApiError({ statusCode: 500 })
      expect(result.message).toBe('errors.serverError')
    })

    it('maps unknown status to generic error', () => {
      const result = handleApiError({ statusCode: 418 })
      expect(result.message).toBe('errors.unknown')
    })

    it('handles missing statusCode', () => {
      const result = handleApiError({})
      expect(result.statusCode).toBe(0)
      expect(result.message).toBe('errors.unknown')
    })

    it('preserves error data as details', () => {
      const result = handleApiError({ statusCode: 400, data: { field: 'email' } })
      expect(result.details).toEqual({ field: 'email' })
    })
  })
})
