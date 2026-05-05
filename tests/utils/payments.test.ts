import { describe, expect, it } from 'vitest'

import {
  computePaymentBreakdown,
  normalizeCheckoutSession,
  normalizeCheckoutSessionStatus,
  normalizeFinalizePaymentResponse,
  normalizePaymentEvents,
  normalizePaymentResponse,
  normalizePaymentsConfig
} from '~/utils/payments'

describe('payments utils', () => {
  it('normalizes a valid payment response', () => {
    const result = normalizePaymentResponse({
      payment_id: 'pay-1',
      reservation_id: 'res-1',
      status: 'confirmed',
      amount_in_cents: 125000,
      currency: 'cop',
      gateway_charge_id: 'ch_123',
      receipt_id: 'receipt-1',
      receipt_number: 'RCPT-001',
      failure_reason: null
    })

    expect(result).toEqual({
      payment_id: 'pay-1',
      reservation_id: 'res-1',
      status: 'confirmed',
      amount_in_cents: 125000,
      currency: 'COP',
      gateway_charge_id: 'ch_123',
      receipt_id: 'receipt-1',
      receipt_number: 'RCPT-001',
      failure_reason: null
    })
  })

  it('returns null for an invalid payment response', () => {
    expect(normalizePaymentResponse('<html></html>')).toBeNull()
  })

  it('normalizes payment events and drops invalid dates safely', () => {
    const result = normalizePaymentEvents([
      {
        event_id: 'evt-1',
        payment_id: 'pay-1',
        event_type: 'payment.succeeded',
        payload: {
          gateway_charge_id: 'ch_123'
        },
        created_at: '2026-04-03T20:36:23Z'
      },
      {
        event_id: 'evt-2',
        payment_id: 'pay-1',
        event_type: 'receipt.generated',
        payload: {},
        created_at: 'not-a-date'
      }
    ])

    expect(result).toHaveLength(2)
    expect(result[0]?.created_at).toBe('2026-04-03T20:36:23Z')
    expect(result[1]?.created_at).toBeNull()
  })

  it('returns an empty array for non-array event payloads', () => {
    expect(normalizePaymentEvents('<html></html>')).toEqual([])
  })

  it('drops invalid payment events that miss required fields', () => {
    const result = normalizePaymentEvents([
      { event_id: '', payment_id: 'pay-1', event_type: 'x', payload: {}, created_at: null },
      { event_id: 'evt', payment_id: '', event_type: 'x', payload: {}, created_at: null },
      { event_id: 'evt', payment_id: 'pay', event_type: '', payload: {}, created_at: null },
      'not-an-object',
      { event_id: 'good', payment_id: 'pay', event_type: 'x', payload: 'not-record', created_at: null }
    ])

    expect(result).toHaveLength(1)
    expect(result[0]?.event_id).toBe('good')
    expect(result[0]?.payload).toEqual({})
  })

  it('treats failed status correctly with failure_reason', () => {
    const result = normalizePaymentResponse({
      payment_id: 'p',
      reservation_id: 'r',
      status: 'failed',
      amount_in_cents: 100,
      currency: '',
      gateway_charge_id: 'ch',
      receipt_id: null,
      receipt_number: '',
      failure_reason: 'card_declined'
    })

    expect(result?.status).toBe('failed')
    expect(result?.failure_reason).toBe('card_declined')
    expect(result?.currency).toBe('COP')
    expect(result?.receipt_number).toBeNull()
  })

  it('returns null when payment_id or reservation_id is missing', () => {
    expect(normalizePaymentResponse({ reservation_id: 'r' })).toBeNull()
    expect(normalizePaymentResponse({ payment_id: 'p' })).toBeNull()
    expect(normalizePaymentResponse({ payment_id: '', reservation_id: 'r' })).toBeNull()
  })

  it('coerces unknown statuses and bad numerics to safe defaults', () => {
    const result = normalizePaymentResponse({
      payment_id: 'p',
      reservation_id: 'r',
      status: 'in-orbit',
      amount_in_cents: Number.NaN,
      currency: 'eur'
    })

    expect(result?.status).toBe('confirmed')
    expect(result?.amount_in_cents).toBe(0)
    expect(result?.currency).toBe('EUR')
  })

  describe('normalizePaymentsConfig', () => {
    it('returns safe defaults for non-objects', () => {
      expect(normalizePaymentsConfig(null)).toEqual({
        provider: 'fake_stripe',
        stripe_enabled: false,
        publishable_key: ''
      })
    })

    it('reads valid fields and defaults provider when missing', () => {
      expect(normalizePaymentsConfig({ stripe_enabled: true, publishable_key: 'pk_test' })).toEqual({
        provider: 'fake_stripe',
        stripe_enabled: true,
        publishable_key: 'pk_test'
      })
    })
  })

  describe('normalizeCheckoutSession', () => {
    it('returns null when payment_transaction_id is missing', () => {
      expect(normalizeCheckoutSession({})).toBeNull()
      expect(normalizeCheckoutSession('nope')).toBeNull()
    })

    it('returns a fully normalised session', () => {
      expect(normalizeCheckoutSession({
        payment_transaction_id: 'tx',
        amount_in_cents: 1000,
        currency: 'usd',
        publishable_key: 'pk',
        stripe_enabled: true
      })).toEqual({
        payment_transaction_id: 'tx',
        amount_in_cents: 1000,
        currency: 'USD',
        publishable_key: 'pk',
        stripe_enabled: true
      })
    })
  })

  describe('normalizeCheckoutSessionStatus', () => {
    it('returns null without payment_transaction_id', () => {
      expect(normalizeCheckoutSessionStatus({})).toBeNull()
    })

    it('drops invalid updated_at dates', () => {
      const result = normalizeCheckoutSessionStatus({
        payment_transaction_id: 'tx',
        status: 'authorized',
        payment_id: 'p',
        payment_intent_id: null,
        error: null,
        updated_at: 'not-a-date'
      })
      expect(result?.updated_at).toBeNull()
    })

    it('keeps a valid updated_at date', () => {
      const result = normalizeCheckoutSessionStatus({
        payment_transaction_id: 'tx',
        updated_at: '2026-04-29T12:00:00Z'
      })
      expect(result?.updated_at).toBe('2026-04-29T12:00:00Z')
    })
  })

  describe('normalizeFinalizePaymentResponse', () => {
    it('returns null for non-objects', () => {
      expect(normalizeFinalizePaymentResponse(null)).toBeNull()
    })

    it('normalises null-like fields', () => {
      const result = normalizeFinalizePaymentResponse({
        status: 'requires_action',
        client_secret: 'cs_123'
      })
      expect(result).toEqual({
        status: 'requires_action',
        payment_id: null,
        payment_intent_id: null,
        client_secret: 'cs_123',
        error: null
      })
    })
  })

  describe('computePaymentBreakdown', () => {
    it('splits amount across the four lines and assigns the remainder to taxes', () => {
      const lines = computePaymentBreakdown(10000)
      expect(lines.map(l => l.key)).toEqual(['accommodation', 'cleaning', 'service', 'taxes'])
      const total = lines.reduce((acc, line) => acc + line.amountInCents, 0)
      expect(total).toBe(10000)
    })

    it('handles invalid amounts by returning zeros', () => {
      const lines = computePaymentBreakdown(Number.NaN)
      expect(lines.every(l => l.amountInCents === 0)).toBe(true)
    })

    it('clamps negative amounts to zero', () => {
      const lines = computePaymentBreakdown(-500)
      expect(lines.every(l => l.amountInCents === 0)).toBe(true)
    })
  })
})
