import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getHostMetrics,
  getRevenueTrends,
  listHostReservations,
} from '~/services/hostReservationsService'

const mockFetch = vi.fn()

vi.stubGlobal('$fetch', mockFetch)

vi.mock('~/utils/api', () => ({
  getApiBaseUrls: () => ({
    reservationsApiUrl: 'http://localhost:3003',
  }),
  handleApiError: (error: unknown) => {
    const err = error as { statusCode?: number }
    return {
      message: 'errors.unknown',
      statusCode: err.statusCode || 0,
      details: null,
    }
  },
}))

describe('hostReservationsService', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listHostReservations', () => {
    it('sends Authorization header and only filled filters', async () => {
      mockFetch.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 10 })

      await listHostReservations('jwt-token', {
        status: ['confirmed'],
        guest_name: 'ana',
        sort_by: 'check_in_date',
        sort_dir: 'desc',
        page: 1,
        page_size: 10,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/reservations/host/me',
        expect.objectContaining({
          baseURL: 'http://localhost:3003',
          method: 'GET',
          query: {
            status: ['confirmed'],
            guest_name: 'ana',
            sort_by: 'check_in_date',
            sort_dir: 'desc',
            page: '1',
            page_size: '10',
          },
          headers: { Authorization: 'Bearer jwt-token' },
        }),
      )
    })

    it('omits Authorization when token is null', async () => {
      mockFetch.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 10 })
      await listHostReservations(null, {})
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/reservations/host/me',
        expect.objectContaining({ headers: {} }),
      )
    })

    it('throws normalized error', async () => {
      mockFetch.mockRejectedValue({ statusCode: 401 })
      await expect(listHostReservations('jwt', {})).rejects.toEqual({
        message: 'errors.unknown',
        statusCode: 401,
        details: null,
      })
    })
  })

  describe('getHostMetrics', () => {
    it('passes range query', async () => {
      mockFetch.mockResolvedValue({})
      await getHostMetrics('jwt', { start_date: '2026-04-01', end_date: '2026-05-01' })
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/reservations/host/me/metrics',
        expect.objectContaining({
          query: { start_date: '2026-04-01', end_date: '2026-05-01' },
        }),
      )
    })
  })

  describe('getRevenueTrends', () => {
    it('passes granularity', async () => {
      mockFetch.mockResolvedValue({ granularity: 'week', currency: null, buckets: [] })
      await getRevenueTrends('jwt', {
        start_date: '2026-04-01',
        end_date: '2026-05-01',
        granularity: 'week',
      })
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/reservations/host/me/revenue-trends',
        expect.objectContaining({
          query: {
            start_date: '2026-04-01',
            end_date: '2026-05-01',
            granularity: 'week',
          },
        }),
      )
    })
  })
})
