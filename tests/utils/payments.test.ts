import { describe, expect, it } from 'vitest'

import { normalizePaymentEvents, normalizePaymentResponse } from '~/utils/payments'

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
})
