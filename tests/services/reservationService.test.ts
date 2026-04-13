import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createReservation, getReservation } from '~/services/reservationService'

const mockFetch = vi.fn()

vi.stubGlobal('$fetch', mockFetch)

vi.mock('~/utils/api', () => ({
  getApiBaseUrls: () => ({
    reservationsApiUrl: 'http://localhost:3003'
  }),
  handleApiError: (error: unknown) => {
    const err = error as { statusCode?: number }
    return {
      message: 'errors.unknown',
      statusCode: err.statusCode || 0,
      details: null
    }
  }
}))

const mockReservationRequest = {
  id_traveler: '11111111-1111-1111-1111-111111111111',
  id_property: '22222222-2222-2222-2222-222222222222',
  id_room: '22222222-2222-2222-2222-222222222222',
  check_in_date: '2026-10-12T00:00:00.000Z',
  check_out_date: '2026-10-17T00:00:00.000Z',
  number_of_guests: 2,
  currency: 'COP'
}

const mockReservationResponse = {
  id: 'res-123',
  ...mockReservationRequest,
  status: 'confirmed'
}

describe('reservationService', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('createReservation', () => {
    it('sends POST request with reservation data', async () => {
      mockFetch.mockResolvedValue(mockReservationResponse)

      const result = await createReservation(mockReservationRequest)

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/reservations', {
        baseURL: 'http://localhost:3003',
        method: 'POST',
        body: mockReservationRequest,
        headers: { 'Content-Type': 'application/json' }
      })
      expect(result).toEqual(mockReservationResponse)
    })

    it('throws API error when request fails', async () => {
      mockFetch.mockRejectedValue({ statusCode: 400 })

      await expect(createReservation(mockReservationRequest)).rejects.toEqual({
        message: 'errors.unknown',
        statusCode: 400,
        details: null
      })
    })
  })

  describe('getReservation', () => {
    it('sends GET request with reservation ID', async () => {
      mockFetch.mockResolvedValue(mockReservationResponse)

      const result = await getReservation('res-123')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/reservations/res-123', {
        baseURL: 'http://localhost:3003',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      expect(result).toEqual(mockReservationResponse)
    })

    it('throws API error when request fails', async () => {
      mockFetch.mockRejectedValue({ statusCode: 404 })

      await expect(getReservation('not-found')).rejects.toEqual({
        message: 'errors.unknown',
        statusCode: 404,
        details: null
      })
    })
  })
})
