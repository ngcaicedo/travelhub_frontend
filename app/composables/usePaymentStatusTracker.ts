import type {
  PaymentResponse,
  PaymentStatus,
  PaymentTrackerCheckoutContext,
  PaymentTrackerState,
  PaymentTrackerStatus
} from '~/utils/payments'
import { normalizePaymentResponse } from '~/utils/payments'
import { paymentsService } from '~/services/payments'

const STORAGE_KEY = 'travelhub:payment-status-tracker'

let activeEventSource: EventSource | null = null
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

function defaultState(): PaymentTrackerState {
  return {
    status: 'idle',
    paymentId: null,
    paymentTransactionId: null,
    reservationId: null,
    error: null,
    visible: false,
    checkoutContext: null
  }
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function normalizeTrackerStatus(value: unknown): PaymentTrackerStatus {
  return value === 'confirmed'
    ? 'confirmed'
    : value === 'failed'
      ? 'failed'
      : value === 'processing'
        ? 'processing'
        : value === 'pending'
          ? 'pending'
          : 'idle'
}

function parseStoredState(raw: string | null): PaymentTrackerState | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<PaymentTrackerState>
    return {
      ...defaultState(),
      ...parsed,
      status: normalizeTrackerStatus(parsed.status)
    }
  } catch {
    return null
  }
}

export const usePaymentStatusTracker = () => {
  const runtimeConfig = useRuntimeConfig()
  const state = useState<PaymentTrackerState>('payment-status-tracker', defaultState)
  const hydrated = useState<boolean>('payment-status-tracker-hydrated', () => false)

  function persistState() {
    if (!isBrowser()) return
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
  }

  function hydrateState() {
    if (hydrated.value || !isBrowser()) return
    const stored = parseStoredState(sessionStorage.getItem(STORAGE_KEY))
    if (stored) {
      state.value = stored
    }
    hydrated.value = true
  }

  function clearReconnectTimeout() {
    if (!reconnectTimeout) return
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }

  function closeStream() {
    clearReconnectTimeout()
    if (!activeEventSource) return
    activeEventSource.close()
    activeEventSource = null
  }

  function patchState(patch: Partial<PaymentTrackerState>) {
    state.value = {
      ...state.value,
      ...patch
    }
    persistState()
  }

  function setCheckoutContext(context: PaymentTrackerCheckoutContext) {
    hydrateState()
    patchState({
      reservationId: context.reservationId,
      checkoutContext: context
    })
  }

  function dismiss() {
    hydrateState()
    patchState({ visible: false })
  }

  function clear() {
    hydrateState()
    closeStream()
    state.value = defaultState()
    persistState()
  }

  function buildCheckoutQuery() {
    const context = state.value.checkoutContext
    if (!context) return {}

    return {
      reservationId: context.reservationId,
      travelerId: context.travelerId,
      amountInCents: String(context.amountInCents),
      currency: context.currency,
      checkInDate: context.checkInDate,
      checkOutDate: context.checkOutDate,
      lockExpiresAt: context.lockExpiresAt != null ? String(context.lockExpiresAt) : undefined
    }
  }

  async function syncPaymentSnapshot(paymentId: string) {
    const normalized = normalizePaymentResponse(await paymentsService.getPayment(paymentId))
    if (!normalized) return null

    patchState({
      paymentId: normalized.payment_id,
      reservationId: normalized.reservation_id,
      status: normalized.status,
      error: normalized.failure_reason,
      visible: true
    })
    return normalized
  }

  function scheduleReconnect(paymentId: string) {
    clearReconnectTimeout()
    reconnectTimeout = setTimeout(async () => {
      try {
        const snapshot = await syncPaymentSnapshot(paymentId)
        if (snapshot && (snapshot.status === 'pending')) {
          connectToPayment(paymentId)
        }
      } catch {
        // Ignore transient reconnect failures; next user action can re-open tracking.
      }
    }, 1500)
  }

  function connectToPayment(paymentId: string) {
    hydrateState()
    if (!isBrowser()) return

    closeStream()
    const baseUrl = String(runtimeConfig.public.paymentsApiBase || '').replace(/\/$/, '')
    if (!baseUrl) return

    activeEventSource = new EventSource(`${baseUrl}/api/v1/payments/${paymentId}/stream`)
    activeEventSource.addEventListener('payment_status', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent<string>).data) as {
          payment_id?: string
          status?: PaymentStatus | PaymentTrackerStatus
          failure_reason?: string | null
        }
        const status = normalizeTrackerStatus(payload.status)
        patchState({
          paymentId: payload.payment_id || paymentId,
          status,
          error: payload.failure_reason || null,
          visible: true
        })

        if (status === 'confirmed' || status === 'failed') {
          closeStream()
        }
      } catch {
        // Ignore malformed events and keep the stream alive.
      }
    })
    activeEventSource.onerror = () => {
      closeStream()
      if (state.value.status === 'pending' || state.value.status === 'processing') {
        scheduleReconnect(paymentId)
      }
    }
  }

  async function startTracking(payload: {
    paymentId: string
    paymentTransactionId: string
    reservationId: string
  }) {
    hydrateState()
    patchState({
      paymentId: payload.paymentId,
      paymentTransactionId: payload.paymentTransactionId,
      reservationId: payload.reservationId,
      status: 'pending',
      error: null,
      visible: true
    })

    try {
      await syncPaymentSnapshot(payload.paymentId)
    } catch {
      // If snapshot fails we still start the stream; the backend is source of truth.
    }
    connectToPayment(payload.paymentId)
  }

  hydrateState()

  return {
    state: readonly(state),
    setCheckoutContext,
    buildCheckoutQuery,
    startTracking,
    syncPaymentSnapshot,
    dismiss,
    clear
  }
}
