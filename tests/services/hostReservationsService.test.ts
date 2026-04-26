import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import {
  addHostReservationNote,
  getHostMetrics,
  getHostReservationDetail,
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

  afterAll(() => {
    vi.unstubAllGlobals()
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

  describe('getHostReservationDetail', () => {
    const mockDetail = {
      reservation: {
        id: 'res-1',
        id_traveler: 'trav-1',
        id_property: 'prop-1',
        id_room: 'room-1',
        check_in_date: '2026-06-01T15:00:00',
        check_out_date: '2026-06-04T12:00:00',
        number_of_guests: 2,
        total_price: '900000.00',
        currency: 'COP',
        status: 'confirmed',
        hold_expires_at: '2026-05-01T10:30:00',
        version: 3,
        created_at: '2026-04-25T10:00:00',
        updated_at: '2026-04-25T11:00:00',
        price_breakdown: {
          accommodation_in_cents: 75000000,
          cleaning_fee_in_cents: 8000000,
          service_fee_in_cents: 6000000,
          taxes_in_cents: 1000000,
          total_in_cents: 90000000,
          currency: 'COP',
          nights: 3,
          nightly_rate_in_cents: 25000000,
        },
      },
      guest: { id: 'usr-1', full_name: 'Juan Viajero', email: 'juan@example.com', phone: null },
      change_history: [],
      internal_notes: [],
      available_actions: [{ action: 'cancel', label: 'Cancelar reserva' }],
    }

    it('calls the correct endpoint with Authorization header', async () => {
      mockFetch.mockResolvedValue(mockDetail)

      const result = await getHostReservationDetail('jwt-token', 'res-1')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/hotel/reservations/res-1',
        expect.objectContaining({
          baseURL: 'http://localhost:3003',
          method: 'GET',
          headers: { Authorization: 'Bearer jwt-token' },
        }),
      )
      expect(result.reservation.id).toBe('res-1')
      expect(result.guest?.full_name).toBe('Juan Viajero')
    })

    it('omits Authorization when token is null', async () => {
      mockFetch.mockResolvedValue(mockDetail)
      await getHostReservationDetail(null, 'res-1')
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/hotel/reservations/res-1',
        expect.objectContaining({ headers: {} }),
      )
    })

    it('throws normalized error on 404', async () => {
      mockFetch.mockRejectedValue({ statusCode: 404 })
      await expect(getHostReservationDetail('jwt', 'missing')).rejects.toEqual({
        message: 'errors.unknown',
        statusCode: 404,
        details: null,
      })
    })
  })

  describe('addHostReservationNote', () => {
    const mockNote = {
      id: 'note-1',
      reservation_id: 'res-1',
      content: 'Necesita cuna extra.',
      author_user_id: 'usr-2',
      author_name: null,
      created_at: '2026-04-25T13:00:00',
    }

    it('posts content to the correct endpoint', async () => {
      mockFetch.mockResolvedValue(mockNote)

      const result = await addHostReservationNote('jwt-token', 'res-1', 'Necesita cuna extra.')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/hotel/reservations/res-1/notes',
        expect.objectContaining({
          baseURL: 'http://localhost:3003',
          method: 'POST',
          body: { content: 'Necesita cuna extra.' },
          headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
        }),
      )
      expect(result.id).toBe('note-1')
    })

    it('throws normalized error on 422', async () => {
      mockFetch.mockRejectedValue({ statusCode: 422 })
      await expect(addHostReservationNote('jwt', 'res-1', '')).rejects.toEqual({
        message: 'errors.unknown',
        statusCode: 422,
        details: null,
      })
    })
  })
})
