import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReservationsHistoryPage from '~/pages/reservations/index.vue'

const latestReservation = ref({
  paymentId: 'payment-123',
  reservationId: 'reservation-123',
  travelerId: 'traveler-123',
  status: 'confirmed',
  amountInCents: 287650,
  currency: 'COP',
  receiptId: 'receipt-123',
  receiptNumber: 'RCPT-123',
  propertyName: 'Renaissance Estate & Private Vineyard',
  checkInDate: '2026-10-12',
  checkOutDate: '2026-10-17'
})

vi.mock('~/composables/usePaymentConfirmation', () => ({
  usePaymentConfirmation: () => ({
    latestReservation
  })
}))

describe('ReservationsHistoryPage', () => {
  beforeEach(() => {
    latestReservation.value = {
      paymentId: 'payment-123',
      reservationId: 'reservation-123',
      travelerId: 'traveler-123',
      status: 'confirmed',
      amountInCents: 287650,
      currency: 'COP',
      receiptId: 'receipt-123',
      receiptNumber: 'RCPT-123',
      propertyName: 'Renaissance Estate & Private Vineyard',
      checkInDate: '2026-10-12',
      checkOutDate: '2026-10-17'
    }
  })

  it('shows the latest reservation summary when history state exists', async () => {
    const wrapper = await mountSuspended(ReservationsHistoryPage)
    const text = wrapper.text()

    expect(text).toContain('Renaissance Estate & Private Vineyard')
    expect(text).toContain('reservation-123')
    expect(text).toContain('RCPT-123')
  })
})
