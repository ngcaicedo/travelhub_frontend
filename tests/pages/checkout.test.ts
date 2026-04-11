import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import CheckoutPage from '~/pages/checkout.vue'

describe('CheckoutPage', () => {
  beforeEach(() => {
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
})

function textContent(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  return wrapper.text()
}
