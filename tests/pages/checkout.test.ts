import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

import CheckoutPage from '~/pages/checkout.vue'

const { usePaymentsComplianceMock } = vi.hoisted(() => ({
  usePaymentsComplianceMock: vi.fn(() => computed(() => false))
}))

mockNuxtImport('usePaymentsCompliance', () => usePaymentsComplianceMock)

describe('CheckoutPage', () => {
  beforeEach(() => {
    usePaymentsComplianceMock.mockReturnValue(computed(() => false))

    vi.stubGlobal('$fetch', vi.fn(async (url: string) => {
      if (url === '/api/payments/config') {
        return {
          provider: 'fake_stripe',
          stripe_enabled: false,
          publishable_key: ''
        }
      }

      throw new Error(`Unexpected fetch call: ${url}`)
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
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

  it('shows the empty events state before any payment is processed', async () => {
    const wrapper = await mountSuspended(CheckoutPage)
    expect(textContent(wrapper)).toMatch(/There are no events yet|eventos/)
  })

  it('renders secure Stripe mode without manual card fields', async () => {
    vi.stubGlobal('$fetch', vi.fn(async (url: string) => {
      if (url === '/api/payments/config') {
        return {
          provider: 'stripe_test',
          stripe_enabled: true,
          publishable_key: 'pk_test_123'
        }
      }

      throw new Error(`Unexpected fetch call: ${url}`)
    }))

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
