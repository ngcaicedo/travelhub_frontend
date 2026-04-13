import { describe, it, expect, vi, beforeEach } from 'vitest'

import { usePaymentConfirmation } from '~/composables/usePaymentConfirmation'

const mockGetPaymentConfirmationSummary = vi.fn()
const mockGetCheckoutStatus = vi.fn()

vi.mock('~/services/payments', () => ({
  paymentsService: {
    getPaymentConfirmationSummary: (...args: unknown[]) => mockGetPaymentConfirmationSummary(...args),
    getCheckoutStatus: (...args: unknown[]) => mockGetCheckoutStatus(...args)
  }
}))

const mockSummary = {
  payment_id: 'pay-123',
  reservation_id: 'res-123',
  traveler_id: 'trav-123',
  status: 'confirmed',
  amount_in_cents: 287650,
  currency: 'COP',
  receipt_id: 'receipt-123',
  receipt_number: 'RCPT-123',
  property_name: 'Test Hotel',
  check_in_date: '2026-10-12',
  check_out_date: '2026-10-17'
}

describe('usePaymentConfirmation', () => {
  beforeEach(() => {
    mockGetPaymentConfirmationSummary.mockReset()
    mockGetCheckoutStatus.mockReset()
  })

  it('initializes with null confirmation and no error', () => {
    const { confirmation, loading, error } = usePaymentConfirmation()
    expect(confirmation.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('loadConfirmation fetches and stores summary', async () => {
    mockGetPaymentConfirmationSummary.mockResolvedValue(mockSummary)

    const { loadConfirmation, confirmation, latestReservation } = usePaymentConfirmation()
    await loadConfirmation('pay-123')

    expect(confirmation.value).toEqual(mockSummary)
    expect(latestReservation.value).toBeTruthy()
    expect(latestReservation.value?.paymentId).toBe('pay-123')
  })

  it('loadConfirmation sets error on network failure', async () => {
    mockGetPaymentConfirmationSummary.mockRejectedValue(new Error('fetch failed'))

    const { loadConfirmation, error } = usePaymentConfirmation()
    await expect(loadConfirmation('pay-123')).rejects.toThrow()

    expect(error.value).toBe('notifications.errors.backendUnavailable')
  })

  it('normalizes timeout errors', async () => {
    mockGetPaymentConfirmationSummary.mockRejectedValue(new Error('request timed out'))

    const { loadConfirmation, error } = usePaymentConfirmation()
    await expect(loadConfirmation('pay-123')).rejects.toThrow()

    expect(error.value).toBe('notifications.errors.backendUnavailable')
  })

  it('normalizes invalid confirmation response errors', async () => {
    mockGetPaymentConfirmationSummary.mockRejectedValue(new Error('payments.errors.invalidConfirmationResponse'))

    const { loadConfirmation, error } = usePaymentConfirmation()
    await expect(loadConfirmation('pay-123')).rejects.toThrow()

    expect(error.value).toBe('notifications.errors.invalidConfirmationResponse')
  })

  it('normalizes invalid checkout status response errors', async () => {
    mockGetPaymentConfirmationSummary.mockRejectedValue(new Error('payments.errors.invalidCheckoutStatusResponse'))

    const { loadConfirmation, error } = usePaymentConfirmation()
    await expect(loadConfirmation('pay-123')).rejects.toThrow()

    expect(error.value).toBe('notifications.errors.invalidCheckoutStatusResponse')
  })

  it('normalizes generic errors', async () => {
    mockGetPaymentConfirmationSummary.mockRejectedValue(new Error('some unknown error'))

    const { loadConfirmation, error } = usePaymentConfirmation()
    await expect(loadConfirmation('pay-123')).rejects.toThrow()

    expect(error.value).toBe('notifications.errors.title')
  })

  describe('reconcilePaymentTransaction', () => {
    it('returns confirmed when checkout status has payment_id', async () => {
      mockGetCheckoutStatus.mockResolvedValue({ payment_id: 'pay-123', status: 'confirmed' })
      mockGetPaymentConfirmationSummary.mockResolvedValue(mockSummary)

      const { reconcilePaymentTransaction } = usePaymentConfirmation()
      const result = await reconcilePaymentTransaction('tx-123', { maxAttempts: 1, intervalMs: 0 })

      expect(result).toEqual({ status: 'confirmed', paymentId: 'pay-123' })
    })

    it('returns failed when checkout status is failed', async () => {
      mockGetCheckoutStatus.mockResolvedValue({ status: 'failed', error: 'card_declined' })

      const { reconcilePaymentTransaction } = usePaymentConfirmation()
      const result = await reconcilePaymentTransaction('tx-123', { maxAttempts: 1, intervalMs: 0 })

      expect(result).toEqual({ status: 'failed', error: 'card_declined' })
    })

    it('returns pending after exhausting attempts', async () => {
      mockGetCheckoutStatus.mockResolvedValue({ status: 'pending' })

      const { reconcilePaymentTransaction } = usePaymentConfirmation()
      const result = await reconcilePaymentTransaction('tx-123', { maxAttempts: 2, intervalMs: 0 })

      expect(result).toEqual({ status: 'pending' })
    })

    it('returns pending when all attempts throw', async () => {
      mockGetCheckoutStatus.mockRejectedValue(new Error('network error'))

      const { reconcilePaymentTransaction } = usePaymentConfirmation()
      const result = await reconcilePaymentTransaction('tx-123', { maxAttempts: 2, intervalMs: 0 })

      expect(result).toEqual({ status: 'pending' })
    })
  })
})
