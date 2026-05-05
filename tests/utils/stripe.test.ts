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

  it('resolves when an existing pending script dispatches load with Stripe set', async () => {
    vi.resetModules()

    const existing = document.createElement('script')
    existing.dataset.stripeJs = 'true'
    document.head.appendChild(existing)

    const { loadStripeJs } = await import('~/utils/stripe')
    const promise = loadStripeJs()

    ;(window as unknown as Record<string, unknown>).Stripe = vi.fn()
    existing.dispatchEvent(new Event('load'))

    await expect(promise).resolves.toBeUndefined()
  })

  it('rejects when an existing pending script dispatches error', async () => {
    vi.resetModules()

    const existing = document.createElement('script')
    existing.dataset.stripeJs = 'true'
    document.head.appendChild(existing)

    const { loadStripeJs } = await import('~/utils/stripe')
    const promise = loadStripeJs()

    existing.dispatchEvent(new Event('error'))

    await expect(promise).rejects.toThrow('Failed to load Stripe.js')
  })

  it('appends a fresh stripe script and resolves on load when Stripe is set', async () => {
    vi.resetModules()

    const appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation(((node: Node) => node) as typeof document.head.appendChild)

    const { loadStripeJs } = await import('~/utils/stripe')
    const promise = loadStripeJs()

    const script = appendSpy.mock.calls[0]?.[0] as HTMLScriptElement
    expect(script).toBeDefined()
    expect(script.src).toBe('https://js.stripe.com/v3/')
    expect(script.dataset.stripeJs).toBe('true')

    ;(window as unknown as Record<string, unknown>).Stripe = vi.fn()
    script.onload?.(new Event('load'))

    await expect(promise).resolves.toBeUndefined()
    expect(script.dataset.loadState).toBe('ready')
  })

  it('rejects when fresh stripe script loads but Stripe global is missing', async () => {
    vi.resetModules()

    const appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation(((node: Node) => node) as typeof document.head.appendChild)

    const { loadStripeJs } = await import('~/utils/stripe')
    const promise = loadStripeJs()

    const script = appendSpy.mock.calls[0]?.[0] as HTMLScriptElement
    script.onload?.(new Event('load'))

    await expect(promise).rejects.toThrow('Failed to load Stripe.js')
    expect(script.dataset.loadState).toBe('loaded')
  })

  it('rejects and resets the cached promise when fresh stripe script errors', async () => {
    vi.resetModules()

    const appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation(((node: Node) => node) as typeof document.head.appendChild)

    const { loadStripeJs } = await import('~/utils/stripe')
    const firstAttempt = loadStripeJs()

    const script = appendSpy.mock.calls[0]?.[0] as HTMLScriptElement
    script.onerror?.(new Event('error'))

    await expect(firstAttempt).rejects.toThrow('Failed to load Stripe.js')
    expect(script.dataset.loadState).toBe('error')

    // After failure the cache must reset so a retry creates a new script.
    appendSpy.mockClear()

    const secondAttempt = loadStripeJs()
    expect(appendSpy).toHaveBeenCalledTimes(1)

    const retry = appendSpy.mock.calls[0]?.[0] as HTMLScriptElement
    ;(window as unknown as Record<string, unknown>).Stripe = vi.fn()
    retry.onload?.(new Event('load'))

    await expect(secondAttempt).resolves.toBeUndefined()
  })
})
