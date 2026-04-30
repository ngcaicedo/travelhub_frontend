import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const mockGetPayment = vi.fn()

vi.mock('~/services/payments', () => ({
  paymentsService: {
    getPayment: (...args: unknown[]) => mockGetPayment(...args)
  }
}))

mockNuxtImport('useRuntimeConfig', () => () => ({
  public: { paymentsApiBase: 'http://test/api' },
  app: { baseURL: '/', buildAssetsDir: '/_nuxt/', cdnURL: '' }
}))

interface FakeEventSourceInstance {
  url: string
  listeners: Map<string, (event: MessageEvent<string>) => void>
  onerror: (() => void) | null
  close: ReturnType<typeof vi.fn>
  addEventListener: (type: string, listener: (event: MessageEvent<string>) => void) => void
}

function setupFakeEventSource() {
  const created: FakeEventSourceInstance[] = []

  class FakeEventSource implements FakeEventSourceInstance {
    url: string
    listeners = new Map<string, (event: MessageEvent<string>) => void>()
    onerror: (() => void) | null = null
    close = vi.fn()

    constructor(url: string) {
      this.url = url
      created.push(this)
    }

    addEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
      this.listeners.set(type, listener)
    }
  }

  vi.stubGlobal('EventSource', FakeEventSource)
  return created
}

describe('usePaymentStatusTracker', () => {
  let createdEventSources: FakeEventSourceInstance[]

  beforeEach(() => {
    sessionStorage.clear()
    mockGetPayment.mockReset()
    createdEventSources = setupFakeEventSource()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('starts with default idle state', async () => {
    const { usePaymentStatusTracker } = await import('~/composables/usePaymentStatusTracker')
    const tracker = usePaymentStatusTracker()

    expect(tracker.state.value.status).toBe('idle')
    expect(tracker.state.value.visible).toBe(false)
    expect(tracker.state.value.paymentId).toBeNull()
    expect(tracker.state.value.checkoutContext).toBeNull()
  })

  it('persists checkout context to sessionStorage and exposes a query', async () => {
    const { usePaymentStatusTracker } = await import('~/composables/usePaymentStatusTracker')
    const tracker = usePaymentStatusTracker()

    tracker.setCheckoutContext({
      reservationId: 'res-1',
      travelerId: 'trav-1',
      amountInCents: 12345,
      currency: 'COP',
      checkInDate: '2026-05-01',
      checkOutDate: '2026-05-05',
      lockExpiresAt: 1735689600
    })

    expect(tracker.state.value.reservationId).toBe('res-1')
    expect(tracker.state.value.checkoutContext?.travelerId).toBe('trav-1')

    const stored = JSON.parse(sessionStorage.getItem('travelhub:payment-status-tracker') || '{}')
    expect(stored.reservationId).toBe('res-1')

    expect(tracker.buildCheckoutQuery()).toEqual({
      reservationId: 'res-1',
      travelerId: 'trav-1',
      amountInCents: '12345',
      currency: 'COP',
      checkInDate: '2026-05-01',
      checkOutDate: '2026-05-05',
      lockExpiresAt: '1735689600'
    })
  })

  it('returns an empty query when no context is set', async () => {
    const { usePaymentStatusTracker } = await import('~/composables/usePaymentStatusTracker')
    const tracker = usePaymentStatusTracker()
    tracker.clear()

    expect(tracker.buildCheckoutQuery()).toEqual({})
  })

  it('serialises a missing lockExpiresAt as undefined in the query', async () => {
    const { usePaymentStatusTracker } = await import('~/composables/usePaymentStatusTracker')
    const tracker = usePaymentStatusTracker()
    tracker.clear()

    tracker.setCheckoutContext({
      reservationId: 'res-1',
      travelerId: 'trav-1',
      amountInCents: 1000,
      currency: 'COP',
      checkInDate: '2026-05-01',
      checkOutDate: '2026-05-02',
      lockExpiresAt: null
    })

    expect(tracker.buildCheckoutQuery().lockExpiresAt).toBeUndefined()
  })

  it('hides the tracker on dismiss without losing other state', async () => {
    const { usePaymentStatusTracker } = await import('~/composables/usePaymentStatusTracker')
    const tracker = usePaymentStatusTracker()

    tracker.setCheckoutContext({
      reservationId: 'res-1',
      travelerId: 'trav-1',
      amountInCents: 1000,
      currency: 'COP',
      checkInDate: '',
      checkOutDate: '',
      lockExpiresAt: null
    })

    tracker.dismiss()

    expect(tracker.state.value.visible).toBe(false)
    expect(tracker.state.value.reservationId).toBe('res-1')
  })

  it('clear resets to defaults and wipes sessionStorage payload', async () => {
    const { usePaymentStatusTracker } = await import('~/composables/usePaymentStatusTracker')
    const tracker = usePaymentStatusTracker()

    tracker.setCheckoutContext({
      reservationId: 'res-1',
      travelerId: 'trav-1',
      amountInCents: 1,
      currency: 'COP',
      checkInDate: '',
      checkOutDate: '',
      lockExpiresAt: null
    })

    tracker.clear()

    expect(tracker.state.value.status).toBe('idle')
    expect(tracker.state.value.checkoutContext).toBeNull()
    const stored = JSON.parse(sessionStorage.getItem('travelhub:payment-status-tracker') || '{}')
    expect(stored.status).toBe('idle')
  })

  it('startTracking patches state, syncs the snapshot and opens an EventSource', async () => {
    mockGetPayment.mockResolvedValue({
      payment_id: 'pay-1',
      reservation_id: 'res-1',
      status: 'pending',
      amount_in_cents: 1000,
      currency: 'COP',
      gateway_charge_id: 'ch_1',
      receipt_id: null,
      receipt_number: null,
      failure_reason: null
    })

    const { usePaymentStatusTracker } = await import('~/composables/usePaymentStatusTracker')
    const tracker = usePaymentStatusTracker()
    tracker.clear()

    await tracker.startTracking({
      paymentId: 'pay-1',
      paymentTransactionId: 'tx-1',
      reservationId: 'res-1'
    })

    expect(mockGetPayment).toHaveBeenCalledWith('pay-1')
    expect(tracker.state.value.paymentId).toBe('pay-1')
    expect(tracker.state.value.paymentTransactionId).toBe('tx-1')
    expect(tracker.state.value.visible).toBe(true)
    expect(tracker.state.value.status).toBe('pending')

    expect(createdEventSources).toHaveLength(1)
    expect(createdEventSources[0]?.url).toBe('http://test/api/api/v1/payments/pay-1/stream')
  })

  it('continues to open the stream when the snapshot fetch fails', async () => {
    mockGetPayment.mockRejectedValue(new Error('boom'))

    const { usePaymentStatusTracker } = await import('~/composables/usePaymentStatusTracker')
    const tracker = usePaymentStatusTracker()
    tracker.clear()

    await tracker.startTracking({
      paymentId: 'pay-2',
      paymentTransactionId: 'tx-2',
      reservationId: 'res-2'
    })

    expect(createdEventSources).toHaveLength(1)
    expect(tracker.state.value.status).toBe('pending')
  })

  it('updates state and closes the stream when a confirmed event arrives', async () => {
    mockGetPayment.mockResolvedValue({
      payment_id: 'pay-3',
      reservation_id: 'res-3',
      status: 'pending',
      amount_in_cents: 0,
      currency: 'COP',
      gateway_charge_id: '',
      receipt_id: null,
      receipt_number: null,
      failure_reason: null
    })

    const { usePaymentStatusTracker } = await import('~/composables/usePaymentStatusTracker')
    const tracker = usePaymentStatusTracker()
    tracker.clear()

    await tracker.startTracking({
      paymentId: 'pay-3',
      paymentTransactionId: 'tx-3',
      reservationId: 'res-3'
    })

    const source = createdEventSources[0]!
    const listener = source.listeners.get('payment_status')!
    listener({ data: JSON.stringify({ payment_id: 'pay-3', status: 'confirmed' }) } as MessageEvent<string>)

    expect(tracker.state.value.status).toBe('confirmed')
    expect(source.close).toHaveBeenCalled()
  })

  it('does not throw on malformed event payloads', async () => {
    mockGetPayment.mockResolvedValue({
      payment_id: 'pay-4',
      reservation_id: 'res-4',
      status: 'pending',
      amount_in_cents: 0,
      currency: 'COP',
      gateway_charge_id: '',
      receipt_id: null,
      receipt_number: null,
      failure_reason: null
    })

    const { usePaymentStatusTracker } = await import('~/composables/usePaymentStatusTracker')
    const tracker = usePaymentStatusTracker()
    tracker.clear()

    await tracker.startTracking({
      paymentId: 'pay-4',
      paymentTransactionId: 'tx-4',
      reservationId: 'res-4'
    })

    const listener = createdEventSources[0]!.listeners.get('payment_status')!
    expect(() => listener({ data: 'not-json' } as MessageEvent<string>)).not.toThrow()
    expect(tracker.state.value.status).toBe('pending')
  })

  it('reschedules a snapshot reconnect when the stream errors during pending', async () => {
    vi.useFakeTimers()

    mockGetPayment.mockResolvedValue({
      payment_id: 'pay-5',
      reservation_id: 'res-5',
      status: 'pending',
      amount_in_cents: 0,
      currency: 'COP',
      gateway_charge_id: '',
      receipt_id: null,
      receipt_number: null,
      failure_reason: null
    })

    const { usePaymentStatusTracker } = await import('~/composables/usePaymentStatusTracker')
    const tracker = usePaymentStatusTracker()
    tracker.clear()

    await tracker.startTracking({
      paymentId: 'pay-5',
      paymentTransactionId: 'tx-5',
      reservationId: 'res-5'
    })

    const firstSource = createdEventSources[0]!
    expect(tracker.state.value.status).toBe('pending')

    mockGetPayment.mockClear()
    firstSource.onerror?.()

    await vi.advanceTimersByTimeAsync(1500)
    expect(mockGetPayment).toHaveBeenCalledWith('pay-5')
  })
})
