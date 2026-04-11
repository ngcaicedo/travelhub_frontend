import type { PaymentConfirmationSummary, ReservationHistoryEntry } from '~/types/payments'
import { paymentsService } from '~/services/payments'

type ReconciliationOutcome =
  | { status: 'confirmed', paymentId: string }
  | { status: 'failed', error: string | null }
  | { status: 'pending' }

function toReservationHistoryEntry(summary: PaymentConfirmationSummary): ReservationHistoryEntry {
  return {
    paymentId: summary.payment_id,
    reservationId: summary.reservation_id,
    travelerId: summary.traveler_id,
    status: summary.status,
    amountInCents: summary.amount_in_cents,
    currency: summary.currency,
    receiptId: summary.receipt_id,
    receiptNumber: summary.receipt_number,
    propertyName: summary.property_name,
    checkInDate: summary.check_in_date,
    checkOutDate: summary.check_out_date
  }
}

export const usePaymentConfirmation = () => {
  const confirmation = useState<PaymentConfirmationSummary | null>('payment-confirmation-summary', () => null)
  const latestReservation = useState<ReservationHistoryEntry | null>('latest-reservation-history', () => null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const normalizeConfirmationError = (err: unknown) => {
    const message = err instanceof Error ? err.message : ''
    const normalized = message.toLowerCase()

    if (message === 'payments.errors.invalidConfirmationResponse') {
      return 'notifications.errors.invalidConfirmationResponse'
    }

    if (message === 'payments.errors.invalidCheckoutStatusResponse') {
      return 'notifications.errors.invalidCheckoutStatusResponse'
    }

    if (
      normalized.includes('timeout')
      || normalized.includes('timed out')
      || normalized.includes('fetch failed')
      || normalized.includes('network')
    ) {
      return 'notifications.errors.backendUnavailable'
    }

    return 'notifications.errors.title'
  }

  const loadConfirmation = async (paymentId: string) => {
    loading.value = true
    error.value = null

    try {
      const summary = await paymentsService.getPaymentConfirmationSummary(paymentId)
      confirmation.value = summary
      latestReservation.value = toReservationHistoryEntry(summary)
      return summary
    } catch (err) {
      error.value = normalizeConfirmationError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const reconcilePaymentTransaction = async (
    paymentTransactionId: string,
    options: { maxAttempts?: number, intervalMs?: number } = {}
  ): Promise<ReconciliationOutcome> => {
    const { maxAttempts = 6, intervalMs = 5000 } = options

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const status = await paymentsService.getCheckoutStatus(paymentTransactionId)

        if (status.payment_id) {
          await loadConfirmation(status.payment_id)
          return { status: 'confirmed', paymentId: status.payment_id }
        }

        if (status.status === 'failed') {
          return { status: 'failed', error: status.error }
        }
      } catch {
        if (attempt === maxAttempts - 1) {
          return { status: 'pending' }
        }
      }

      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs))
      }
    }

    return { status: 'pending' }
  }

  return {
    confirmation: readonly(confirmation),
    latestReservation: readonly(latestReservation),
    loading: readonly(loading),
    error: readonly(error),
    loadConfirmation,
    reconcilePaymentTransaction
  }
}
