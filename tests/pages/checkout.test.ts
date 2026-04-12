import { computed, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

import CheckoutPage from '~/pages/checkout.vue'

const { usePaymentsComplianceMock } = vi.hoisted(() => ({
  usePaymentsComplianceMock: vi.fn(() => computed(() => false))
}))

mockNuxtImport('usePaymentsCompliance', () => usePaymentsComplianceMock)

const mockGetConfig = vi.fn()
const mockCreateCharge = vi.fn()
const mockGetPayment = vi.fn()
const mockGetPaymentEvents = vi.fn()
const mockCreateIntent = vi.fn()
const mockFinalizePayment = vi.fn()
const mockGetCheckoutStatus = vi.fn()
const mockGetPaymentConfirmationSummary = vi.fn()

vi.mock('~/services/payments', () => ({
  paymentsService: {
    getConfig: (...args: unknown[]) => mockGetConfig(...args),
    createCharge: (...args: unknown[]) => mockCreateCharge(...args),
    getPayment: (...args: unknown[]) => mockGetPayment(...args),
    getPaymentEvents: (...args: unknown[]) => mockGetPaymentEvents(...args),
    createIntent: (...args: unknown[]) => mockCreateIntent(...args),
    finalizePayment: (...args: unknown[]) => mockFinalizePayment(...args),
    getCheckoutStatus: (...args: unknown[]) => mockGetCheckoutStatus(...args),
    getPaymentConfirmationSummary: (...args: unknown[]) => mockGetPaymentConfirmationSummary(...args)
  }
}))

function setupDefaultMocks({
  config = {
    provider: 'fake_stripe',
    stripe_enabled: false,
    publishable_key: ''
  },
  charges = [] as Array<Record<string, unknown> | { error: unknown }>,
  payments = {} as Record<string, Record<string, unknown>>,
  events = {} as Record<string, unknown[]>,
  checkoutStatuses = [] as Record<string, unknown>[]
} = {}) {
  let chargeCalls = 0
  let checkoutCalls = 0

  mockGetConfig.mockResolvedValue(config)

  mockCreateCharge.mockImplementation(async () => {
    const response = charges[chargeCalls] || charges[charges.length - 1]
    chargeCalls += 1

    if (!response) {
      throw new Error('Missing mocked charges response')
    }

    if ('error' in response) {
      throw response.error
    }

    return response
  })

  mockGetPayment.mockImplementation(async (paymentId: string) => {
    const payment = payments[paymentId]
    if (!payment) {
      throw new Error(`Missing mocked payment ${paymentId}`)
    }
    return payment
  })

  mockGetPaymentEvents.mockImplementation(async (paymentId: string) => {
    return events[paymentId] || []
  })

  mockGetCheckoutStatus.mockImplementation(async () => {
    const response = checkoutStatuses[checkoutCalls] || checkoutStatuses[checkoutStatuses.length - 1]
    checkoutCalls += 1
    return response
  })
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    usePaymentsComplianceMock.mockReturnValue(computed(() => false))
    setupDefaultMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mockGetConfig.mockReset()
    mockCreateCharge.mockReset()
    mockGetPayment.mockReset()
    mockGetPaymentEvents.mockReset()
    mockCreateIntent.mockReset()
    mockFinalizePayment.mockReset()
    mockGetCheckoutStatus.mockReset()
    mockGetPaymentConfirmationSummary.mockReset()
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

    const vm = wrapper.vm as unknown as { form: { scenario: string } }
    vm.form.scenario = 'declined'
    await nextTick()

    const values = wrapper.findAll('input').map(input => (input.element as HTMLInputElement).value)

    expect(values).toContain('**** **** **** 0002')
    expect(values).toContain('pm_fail_card_declined')
  })

  it('shows the empty events state before any payment is processed', async () => {
    const wrapper = await mountSuspended(CheckoutPage)
    expect(textContent(wrapper)).toMatch(/There are no events yet|eventos/)
  })

  it('processes a successful fake payment and renders the latest result', async () => {
    setupDefaultMocks({
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
    })

    const wrapper = await mountSuspended(CheckoutPage)
    await findButtonByText(wrapper, /Pagar ahora|Pay now/).trigger('click')
    await flushPromises()

    const text = textContent(wrapper)
    expect(text).toMatch(/Payment confirmed|Pago confirmado/)
    expect(text).toContain('pay-success')
    expect(text).toContain('REC-001')
  })

  it('shows the insufficient funds feedback when the gateway rejects the card', async () => {
    setupDefaultMocks({
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
    })

    const wrapper = await mountSuspended(CheckoutPage)

    await findButtonByText(wrapper, /Pagar ahora|Pay now/).trigger('click')
    await flushPromises()

    expect(textContent(wrapper)).toMatch(/insufficient funds|fondos insuficientes|fundos insuficientes/i)
  })

  it('blocks duplicate attempts in fake mode', async () => {
    setupDefaultMocks({
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
    })

    const wrapper = await mountSuspended(CheckoutPage)
    await findButtonByText(wrapper, /Probar duplicado|Test duplicate/).trigger('click')
    await flushPromises()

    expect(textContent(wrapper)).toMatch(/Duplicate payment blocked|duplicado|duplicado/)
  })

  it('renders secure Stripe mode without manual card fields', async () => {
    setupDefaultMocks({
      config: {
        provider: 'stripe_test',
        stripe_enabled: true,
        publishable_key: 'pk_test_123'
      }
    })

    const wrapper = await mountSuspended(CheckoutPage)
    const text = textContent(wrapper)

    expect(text).toMatch(/Prepare secure form|Preparar formulario seguro|Preparar formulario seguro|Preparar formulario/)
    expect(text).not.toMatch(/Token de pago|Payment token/)
    expect(text).not.toMatch(/Probar duplicado|Test duplicate/)
    expect(wrapper.find('#stripe-payment-element').exists()).toBe(true)
  })

  it('hides manual card flows when compliance mode is active even if backend falls back to fake mode', async () => {
    usePaymentsComplianceMock.mockReturnValue(computed(() => true))

    const wrapper = await mountSuspended(CheckoutPage)
    const text = textContent(wrapper)

    expect(text).toMatch(/Financial data protection enabled|Proteccion financiera activa|Protecao financeira ativa/)
    expect(text).toMatch(/Stripe secure mode is not ready|El modo seguro de Stripe no esta listo|O modo seguro do Stripe nao esta pronto/)
    expect(text).not.toMatch(/Token de pago|Payment token/)
    expect(text).not.toMatch(/Probar duplicado|Test duplicate/)
  })
})

function textContent(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  return wrapper.text()
}

function findButtonByText(
  wrapper: Awaited<ReturnType<typeof mountSuspended>>,
  pattern: RegExp
) {
  const button = wrapper.findAll('button').find(candidate => pattern.test(candidate.text()))

  if (!button) {
    throw new Error(`Button not found for pattern: ${pattern.toString()}`)
  }

  return button
}
