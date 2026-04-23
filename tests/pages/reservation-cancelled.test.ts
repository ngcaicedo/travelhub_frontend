import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReservationCancelledPage from '~/pages/reservations/[id]/cancelled.vue'

const getReservation = vi.fn()

vi.mock('~/composables/useReservations', () => ({
  useReservations: () => ({
    getReservation
  })
}))

describe('ReservationCancelledPage', () => {
  beforeEach(() => {
    getReservation.mockReset().mockResolvedValue({
      id: 'res-123',
      status: 'refund_completed',
      total_price: '1200',
      currency: 'COP',
      check_in_date: '2026-10-12T00:00:00.000Z',
      check_out_date: '2026-10-15T00:00:00.000Z',
      number_of_guests: 2,
      created_at: '2026-09-01T00:00:00.000Z'
    })
  })

  it('renders cancelled confirmation summary', async () => {
    const wrapper = await mountSuspended(ReservationCancelledPage, {
      route: {
        params: { id: 'res-123' }
      }
    })

    const text = wrapper.text()

    expect(text).toMatch(/Reservation cancelled successfully|Reserva cancelada exitosamente|Reserva cancelada com sucesso/)
    expect(text).toMatch(/Cancellation summary|Resumen de cancelación|Resumo do cancelamento/)
    expect(text).toContain('res-123')
  })
})
