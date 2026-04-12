import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { paymentsService } from '~/services/payments'

const mockFetch = vi.fn()

vi.mock('~/services/_client', () => ({
  createPaymentsClient: () => mockFetch
}))

describe('paymentsService', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getConfig', () => {
    it('calls the correct endpoint', async () => {
      const config = { provider: 'fake_stripe', stripe_enabled: false, publishable_key: '' }
      mockFetch.mockResolvedValue(config)

      const result = await paymentsService.getConfig()

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/payments/config', {
        timeout: 10_000
      })
      expect(result).toEqual(config)
    })
  })

  describe('createCharge', () => {
    it('calls the correct endpoint with POST and body', async () => {
      const body = {
        reservation_id: 'res-1',
        traveler_id: 'trav-1',
        payment_method_token: 'pm_tok_visa_ok',
        amount_in_cents: 100000,
        currency: 'COP',
        idempotency_key: 'key-1'
      }
      const response = { payment_id: 'pay-1', status: 'confirmed' }
      mockFetch.mockResolvedValue(response)

      const result = await paymentsService.createCharge(body)

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/payments/charges', {
        method: 'POST',
        timeout: 10_000,
        body
      })
      expect(result).toEqual(response)
    })
  })

  describe('createIntent', () => {
    it('calls the correct endpoint with POST and body', async () => {
      const body = {
        reservation_id: 'res-1',
        traveler_id: 'trav-1',
        amount_in_cents: 100000,
        currency: 'COP',
        property_name: 'Test Hotel',
        check_in_date: '2026-10-12',
        check_out_date: '2026-10-17'
      }
      const response = { payment_transaction_id: 'tx-1', publishable_key: 'pk_test' }
      mockFetch.mockResolvedValue(response)

      const result = await paymentsService.createIntent(body)

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/payments/create-intent', {
        method: 'POST',
        timeout: 10_000,
        body
      })
      expect(result).toEqual(response)
    })
  })

  describe('finalizePayment', () => {
    it('calls the correct endpoint with POST and body', async () => {
      const body = {
        payment_transaction_id: 'tx-1',
        confirmation_token_id: 'ct-1'
      }
      const response = { status: 'confirmed', payment_id: 'pay-1' }
      mockFetch.mockResolvedValue(response)

      const result = await paymentsService.finalizePayment(body)

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/payments/finalize', {
        method: 'POST',
        timeout: 10_000,
        body
      })
      expect(result).toEqual(response)
    })
  })

  describe('getPayment', () => {
    it('calls the correct endpoint with payment ID', async () => {
      const response = { payment_id: 'pay-1', status: 'confirmed' }
      mockFetch.mockResolvedValue(response)

      const result = await paymentsService.getPayment('pay-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/payments/pay-1', {
        timeout: 10_000
      })
      expect(result).toEqual(response)
    })
  })

  describe('getPaymentEvents', () => {
    it('calls the correct endpoint with payment ID', async () => {
      const events = [{ event_id: 'evt-1', event_type: 'payment.succeeded' }]
      mockFetch.mockResolvedValue(events)

      const result = await paymentsService.getPaymentEvents('pay-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/payments/pay-1/events', {
        timeout: 10_000
      })
      expect(result).toEqual(events)
    })
  })

  describe('getPaymentConfirmationSummary', () => {
    it('calls the correct endpoint and normalizes the response', async () => {
      const raw = {
        payment_id: 'pay-1',
        reservation_id: 'res-1',
        traveler_id: 'trav-1',
        status: 'confirmed',
        amount_in_cents: 287650,
        currency: 'COP',
        receipt_id: 'receipt-1',
        receipt_number: 'REC-001',
        property_name: 'Hotel Test',
        check_in_date: '2026-10-12',
        check_out_date: '2026-10-17'
      }
      mockFetch.mockResolvedValue(raw)

      const result = await paymentsService.getPaymentConfirmationSummary('pay-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/payments/pay-1/confirmation', {
        method: 'GET'
      })
      expect(result).toEqual(raw)
    })

    it('throws when response is invalid', async () => {
      mockFetch.mockResolvedValue({ invalid: true })

      await expect(paymentsService.getPaymentConfirmationSummary('pay-1'))
        .rejects.toThrow('payments.errors.invalidConfirmationResponse')
    })
  })

  describe('getCheckoutStatus', () => {
    it('calls the correct endpoint and normalizes the response', async () => {
      const raw = {
        payment_transaction_id: 'tx-1',
        status: 'confirmed',
        payment_id: 'pay-1',
        payment_intent_id: 'pi-1',
        error: null,
        updated_at: '2026-04-11T17:00:00Z'
      }
      mockFetch.mockResolvedValue(raw)

      const result = await paymentsService.getCheckoutStatus('tx-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/payments/checkout/tx-1', {
        method: 'GET'
      })
      expect(result).toEqual(raw)
    })

    it('throws when response is invalid', async () => {
      mockFetch.mockResolvedValue({ invalid: true })

      await expect(paymentsService.getCheckoutStatus('tx-1'))
        .rejects.toThrow('payments.errors.invalidCheckoutStatusResponse')
    })
  })

  describe('error propagation', () => {
    it('propagates fetch errors from createCharge', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(paymentsService.createCharge({
        reservation_id: 'res-1',
        traveler_id: 'trav-1',
        payment_method_token: 'pm_tok',
        amount_in_cents: 100000,
        currency: 'COP',
        idempotency_key: 'key-1'
      })).rejects.toThrow('Network error')
    })

    it('propagates fetch errors from getConfig', async () => {
      mockFetch.mockRejectedValue(new Error('Service unavailable'))

      await expect(paymentsService.getConfig())
        .rejects.toThrow('Service unavailable')
    })
  })
})
