import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PaymentConfirmationPage from '~/pages/notifications/payment-confirmation.vue'

const confirmation = ref({
  payment_id: 'payment-123',
  reservation_id: 'reservation-123',
  traveler_id: 'traveler-123',
  status: 'confirmed',
  amount_in_cents: 287650,
  currency: 'COP',
  receipt_id: 'receipt-123',
  receipt_number: 'RCPT-123',
  property_name: 'Renaissance Estate & Private Vineyard',
  check_in_date: '2026-10-12',
  check_out_date: '2026-10-17'
})

const latestReservation = ref(null)
const loading = ref(false)
const error = ref<string | null>(null)
const loadConfirmation = vi.fn()
const reconcilePaymentTransaction = vi.fn()

vi.mock('~/composables/usePaymentConfirmation', () => ({
  usePaymentConfirmation: () => ({
    confirmation,
    latestReservation,
    loading,
    error,
    loadConfirmation,
    reconcilePaymentTransaction
  })
}))

describe('PaymentConfirmationPage', () => {
  beforeEach(() => {
    loading.value = false
    error.value = null
    confirmation.value = {
      payment_id: 'payment-123',
      reservation_id: 'reservation-123',
      traveler_id: 'traveler-123',
      status: 'confirmed',
      amount_in_cents: 287650,
      currency: 'COP',
      receipt_id: 'receipt-123',
      receipt_number: 'RCPT-123',
      property_name: 'Renaissance Estate & Private Vineyard',
      check_in_date: '2026-10-12',
      check_out_date: '2026-10-17'
    }
    loadConfirmation.mockReset().mockResolvedValue(confirmation.value)
    reconcilePaymentTransaction.mockReset()
  })

  it('renders the payment confirmation summary and actions', async () => {
    const wrapper = await mountSuspended(PaymentConfirmationPage, {
      route: {
        query: { paymentId: 'payment-123' }
      }
    })

    const text = wrapper.text()
    expect(loadConfirmation).toHaveBeenCalledWith('payment-123')
    expect(text).toContain('Renaissance Estate & Private Vineyard')
    expect(text).toMatch(/Booking Confirmed|Reserva confirmada/)
    expect(text).toMatch(/View my reservations|Ver mis reservas|Ver minhas reservas/)
    expect(text).toMatch(/Download receipt|Descargar recibo|Baixar recibo/)
    expect(text).toContain('Oct 12, 2026')
    expect(text).toContain('Oct 17, 2026')
  })
})
