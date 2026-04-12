import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import CheckoutPage from '~/pages/checkout.vue'

type FetchPayload = Record<string, unknown>
type FetchOptions = {
  method?: string
  body?: FetchPayload
}

function createFetchMock({
  config = {
    provider: 'fake_stripe',
    stripe_enabled: false,
    publishable_key: ''
  },
  charges = [],
  payments = {},
  events = {},
  checkoutStatuses = []
}: {
  config?: Record<string, unknown>
  charges?: Array<Record<string, unknown> | { error: unknown }>
  payments?: Record<string, Record<string, unknown>>
  events?: Record<string, unknown[]>
  checkoutStatuses?: Record<string, unknown>[]
} = {}) {
  let chargeCalls = 0
  let checkoutCalls = 0

  return vi.fn(async (url: string, options?: FetchOptions) => {
    if (url === '/api/payments/config') {
      return config
    }

    if (url === '/api/payments/charges' && options?.method === 'POST') {
      const response = charges[chargeCalls] || charges[charges.length - 1]
      chargeCalls += 1

      if (!response) {
        throw new Error('Missing mocked /charges response')
      }

      if ('error' in response) {
        throw response.error
      }

      return response
    }

    if (url.startsWith('/api/payments/checkout/')) {
      const response = checkoutStatuses[checkoutCalls] || checkoutStatuses[checkoutStatuses.length - 1]
      checkoutCalls += 1
      return response
    }

    if (url.startsWith('/api/payments/') && url.endsWith('/events')) {
      const paymentId = url.split('/')[3]
      return events[paymentId] || []
    }

    if (url.startsWith('/api/payments/')) {
      const paymentId = url.split('/')[3]
      const payment = payments[paymentId]

      if (!payment) {
        throw new Error(`Missing mocked payment ${paymentId}`)
      }

      return payment
    }

    throw new Error(`Unexpected fetch call: ${url}`)
  })
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.stubGlobal('$fetch', createFetchMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders the checkout title and primary actions', async () => {
    const wrapper = await mountSuspended(CheckoutPage)
    const text = wrapper.text()

    expect(text).toMatch(/Proceso de pago|Checkout/)
    expect(text).toMatch(/Pagar ahora|Pay now/)
    expect(text).toMatch(/Probar duplicado|Test duplicate/)
  })

  it('renders editable payment fields', async () => {
    const wrapper = await mountSuspended(CheckoutPage)
    const inputs = wrapper.findAll('input')
    const text = textContent(wrapper)

    expect(inputs.length).toBeGreaterThan(5)
    expect(text).toMatch(/Token de pago|Payment token/)
    expect(text).toMatch(/Card number|tarjeta/)
  })

  it('updates tokenized mock fields when the scenario changes', async () => {
    const wrapper = await mountSuspended(CheckoutPage)

    await wrapper.find('select').setValue('declined')
    await nextTick()

    const values = wrapper.findAll('input').map(input => (input.element as HTMLInputElement).value)

    expect(values).toContain('4000 0000 0000 0002')
    expect(values).toContain('pm_fail_card_declined')
  })

  it('shows the empty events state before any payment is processed', async () => {
    const wrapper = await mountSuspended(CheckoutPage)
    expect(textContent(wrapper)).toMatch(/There are no events yet|eventos/)
  })

  it('processes a successful fake payment and renders the latest result', async () => {
    vi.stubGlobal('$fetch', createFetchMock({
      charges: [
        {
          payment_id: 'pay-success',
          reservation_id: 'reservation-1',
          status: 'confirmed',
          amount_in_cents: 287650,
          currency: 'COP',
          gateway_charge_id: 'ch_123',
          receipt_id: 'receipt-1',
          receipt_number: 'REC-001',
          failure_reason: null
        }
      ],
      payments: {
        'pay-success': {
          payment_id: 'pay-success',
          reservation_id: 'reservation-1',
          status: 'confirmed',
          amount_in_cents: 287650,
          currency: 'COP',
          gateway_charge_id: 'ch_123',
          receipt_id: 'receipt-1',
          receipt_number: 'REC-001',
          failure_reason: null
        }
      },
      events: {
        'pay-success': [
          {
            event_id: 'evt-1',
            payment_id: 'pay-success',
            event_type: 'payment.succeeded',
            payload: { receipt_number: 'REC-001' },
            created_at: '2026-04-11T17:00:00Z'
          }
        ]
      }
    }))

    const wrapper = await mountSuspended(CheckoutPage)
    await wrapper.findAll('button')[0].trigger('click')
    await flushPromises()

    const text = textContent(wrapper)
    expect(text).toMatch(/Payment confirmed|Pago confirmado/)
    expect(text).toContain('pay-success')
    expect(text).toContain('REC-001')
  })

  it('shows the insufficient funds feedback when the gateway rejects the card', async () => {
    vi.stubGlobal('$fetch', createFetchMock({
      charges: [
        {
          payment_id: 'pay-failed',
          reservation_id: 'reservation-1',
          status: 'failed',
          amount_in_cents: 287650,
          currency: 'COP',
          gateway_charge_id: 'ch_fail',
          receipt_id: null,
          receipt_number: null,
          failure_reason: 'insufficient_funds'
        }
      ],
      payments: {
        'pay-failed': {
          payment_id: 'pay-failed',
          reservation_id: 'reservation-1',
          status: 'failed',
          amount_in_cents: 287650,
          currency: 'COP',
          gateway_charge_id: 'ch_fail',
          receipt_id: null,
          receipt_number: null,
          failure_reason: 'insufficient_funds'
        }
      }
    }))

    const wrapper = await mountSuspended(CheckoutPage)
    await wrapper.findAll('button')[0].trigger('click')
    await flushPromises()

    expect(textContent(wrapper)).toMatch(/Insufficient funds|fondos insuficientes|fundos insuficientes/)
  })

  it('blocks duplicate attempts in fake mode', async () => {
    vi.stubGlobal('$fetch', createFetchMock({
      charges: [
        {
          payment_id: 'pay-first',
          reservation_id: 'reservation-1',
          status: 'confirmed',
          amount_in_cents: 287650,
          currency: 'COP',
          gateway_charge_id: 'ch_first',
          receipt_id: 'receipt-1',
          receipt_number: 'REC-001',
          failure_reason: null
        },
        {
          error: {
            data: {
              detail: {
                message: 'Duplicate payment blocked by idempotency key'
              }
            }
          }
        }
      ],
      payments: {
        'pay-first': {
          payment_id: 'pay-first',
          reservation_id: 'reservation-1',
          status: 'confirmed',
          amount_in_cents: 287650,
          currency: 'COP',
          gateway_charge_id: 'ch_first',
          receipt_id: 'receipt-1',
          receipt_number: 'REC-001',
          failure_reason: null
        }
      }
    }))

    const wrapper = await mountSuspended(CheckoutPage)
    await wrapper.findAll('button')[1].trigger('click')
    await flushPromises()

    expect(textContent(wrapper)).toMatch(/Duplicate payment blocked|duplicado|duplicado/)
  })

  it('renders secure Stripe mode without manual card fields', async () => {
    vi.stubGlobal('$fetch', createFetchMock({
      config: {
        provider: 'stripe_test',
        stripe_enabled: true,
        publishable_key: 'pk_test_123'
      }
    }))

    const wrapper = await mountSuspended(CheckoutPage)
    const text = textContent(wrapper)

    expect(text).toMatch(/Prepare secure form|Preparar formulario seguro|Preparar formulário seguro/)
    expect(text).not.toMatch(/Token de pago|Payment token/)
    expect(text).not.toMatch(/Probar duplicado|Test duplicate/)
    expect(wrapper.find('#stripe-payment-element').exists()).toBe(true)
  })
})

function textContent(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  return wrapper.text()
}
