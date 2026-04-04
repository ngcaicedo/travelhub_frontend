import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import CheckoutPage from '~/pages/checkout.vue'

describe('CheckoutPage', () => {
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

    expect(inputs.length).toBeGreaterThan(5)
    expect(textContent(wrapper)).toMatch(/Token de pago|Payment token/)
    expect(textContent(wrapper)).toMatch(/Número de tarjeta|Card number/)
  })

  it('shows the empty events state before any payment is processed', async () => {
    const wrapper = await mountSuspended(CheckoutPage)
    expect(textContent(wrapper)).toMatch(/Aún no hay eventos|There are no events yet/)
  })
})

function textContent(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  return wrapper.text()
}
