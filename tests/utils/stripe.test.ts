import { describe, it, expect, vi, afterEach } from 'vitest'

describe('loadStripeJs', () => {
  afterEach(() => {
    document.querySelectorAll('script[data-stripe-js]').forEach(el => el.remove())
    delete (window as unknown as Record<string, unknown>).Stripe
    vi.restoreAllMocks()
  })

  it('resolves immediately if window.Stripe already exists', async () => {
    vi.resetModules()
    ;(window as unknown as Record<string, unknown>).Stripe = vi.fn()

    const { loadStripeJs } = await import('~/utils/stripe')
    await expect(loadStripeJs()).resolves.toBeUndefined()
  })

  it('rejects when script has error loadState', async () => {
    vi.resetModules()

    // Pre-create a script element with error state
    const existing = document.createElement('script')
    existing.dataset.stripeJs = 'true'
    existing.dataset.loadState = 'error'
    document.head.appendChild(existing)

    const { loadStripeJs } = await import('~/utils/stripe')
    await expect(loadStripeJs()).rejects.toThrow('Failed to load Stripe.js')
  })

  it('rejects when script has loaded state but no Stripe global', async () => {
    vi.resetModules()

    const existing = document.createElement('script')
    existing.dataset.stripeJs = 'true'
    existing.dataset.loadState = 'loaded'
    document.head.appendChild(existing)

    const { loadStripeJs } = await import('~/utils/stripe')
    await expect(loadStripeJs()).rejects.toThrow('Failed to load Stripe.js')
  })

  it('resolves when existing script is present and Stripe is already loaded', async () => {
    vi.resetModules()
    ;(window as unknown as Record<string, unknown>).Stripe = vi.fn()

    const existing = document.createElement('script')
    existing.dataset.stripeJs = 'true'
    document.head.appendChild(existing)

    const { loadStripeJs } = await import('~/utils/stripe')
    await expect(loadStripeJs()).resolves.toBeUndefined()
  })
})
