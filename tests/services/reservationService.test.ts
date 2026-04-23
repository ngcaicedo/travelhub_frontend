import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  confirmReservationCancellation,
  confirmReservationModification,
  createReservation,
  getReservation,
  getReservationsByUser,
  getReservationHistory,
  previewReservationCancellation,
  previewReservationModification
} from '~/services/reservationService'

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

const mockModificationPreviewPayload = {
  check_in_date: '2026-10-12T00:00:00.000Z',
  check_out_date: '2026-10-18T00:00:00.000Z',
  number_of_guests: 3
}

const mockModificationPreviewResponse = {
  reservation_before: mockReservationResponse,
  reservation_after_preview: {
    ...mockReservationResponse,
    check_out_date: '2026-10-18T00:00:00.000Z'
  },
  delta_amount: '200.00',
  requires_additional_charge: true,
  estimated_refund_amount: '0.00',
  policy_applied: 'Seasonal price adjustment',
  change_allowed: true,
  reasons: []
}

const mockConfirmResponse = {
  reservation: mockReservationResponse,
  status_before: 'confirmed',
  status_after: 'modification_pending_payment',
  action_applied: 'modification_confirmed',
  idempotency_key: 'idem-123',
  additional_charge_amount: '200.00',
  refund_amount: '0.00'
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

  describe('getReservationsByUser', () => {
    it('sends GET request for reservations by user', async () => {
      const mockReservations = [{ id: 'res-1', reservation: mockReservationResponse }]
      mockFetch.mockResolvedValue(mockReservations)

      const result = await getReservationsByUser('traveler-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/reservations/users/traveler-1', {
        baseURL: 'http://localhost:3003',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      expect(result).toEqual(mockReservations)
    })
  })

  describe('previewReservationModification', () => {
    it('sends preview request with payload', async () => {
      mockFetch.mockResolvedValue(mockModificationPreviewResponse)

      const result = await previewReservationModification('res-123', mockModificationPreviewPayload)

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/reservations/res-123/modifications/preview', {
        baseURL: 'http://localhost:3003',
        method: 'POST',
        body: mockModificationPreviewPayload,
        headers: { 'Content-Type': 'application/json' }
      })
      expect(result).toEqual(mockModificationPreviewResponse)
    })
  })

  describe('confirmReservationModification', () => {
    it('sends confirm request with traveler header and idempotency key', async () => {
      mockFetch.mockResolvedValue(mockConfirmResponse)

      const payload = {
        idempotency_key: 'idem-123',
        ...mockModificationPreviewPayload
      }

      const result = await confirmReservationModification('res-123', 'traveler-1', payload)

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/reservations/res-123/modifications/confirm', {
        baseURL: 'http://localhost:3003',
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'application/json',
          'X-Traveler-Id': 'traveler-1'
        }
      })
      expect(result).toEqual(mockConfirmResponse)
    })
  })

  describe('previewReservationCancellation', () => {
    it('sends cancellation preview request', async () => {
      const previewResponse = {
        refund_amount: '845.00',
        penalty_amount: '405.00',
        refund_type: 'partial',
        eligible_until: null,
        policy_applied: '30% penalty after free cancellation window',
        change_allowed: true,
        reasons: []
      }
      mockFetch.mockResolvedValue(previewResponse)

      const result = await previewReservationCancellation('res-123')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/reservations/res-123/cancellation/preview', {
        baseURL: 'http://localhost:3003',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      expect(result).toEqual(previewResponse)
    })
  })

  describe('confirmReservationCancellation', () => {
    it('sends cancellation confirm request with traveler header', async () => {
      mockFetch.mockResolvedValue({
        ...mockConfirmResponse,
        status_after: 'cancel_requested',
        action_applied: 'cancellation_confirmed'
      })

      const payload = {
        idempotency_key: 'idem-cancel-1',
        reason: 'Change of plans'
      }

      await confirmReservationCancellation('res-123', 'traveler-1', payload)

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/reservations/res-123/cancellation/confirm', {
        baseURL: 'http://localhost:3003',
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'application/json',
          'X-Traveler-Id': 'traveler-1'
        }
      })
    })
  })

  describe('getReservationHistory', () => {
    it('sends history request with traveler header', async () => {
      const history = [
        {
          type: 'reservation.modified',
          timestamp: '2026-10-10T00:00:00Z'
        }
      ]
      mockFetch.mockResolvedValue(history)

      const result = await getReservationHistory('res-123', 'traveler-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/reservations/res-123/history', {
        baseURL: 'http://localhost:3003',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Traveler-Id': 'traveler-1'
        }
      })
      expect(result).toEqual(history)
    })
  })
})
