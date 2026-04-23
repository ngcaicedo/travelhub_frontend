import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReservationCancelPage from '~/pages/reservations/[id]/cancel.vue'

const getReservation = vi.fn()
const previewCancellation = vi.fn()
const confirmCancellation = vi.fn()
const pollReservationUntilFinal = vi.fn()
const buildIdempotencyKey = vi.fn(() => 'reservation-cancellation-idem')

vi.mock('~/composables/useReservations', () => ({
  useReservations: () => ({
    getReservation,
    previewCancellation,
    confirmCancellation,
    pollReservationUntilFinal,
    buildIdempotencyKey
  })
}))

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    userId: 'traveler-1'
  })
}))

describe('ReservationCancelPage', () => {
  beforeEach(() => {
    getReservation.mockReset().mockResolvedValue({
      id: 'res-123',
      status: 'confirmed',
      total_price: '1200',
      currency: 'COP',
      check_in_date: '2026-10-12T00:00:00.000Z',
      check_out_date: '2026-10-15T00:00:00.000Z',
      number_of_guests: 2,
      created_at: '2026-09-01T00:00:00.000Z'
    })
    previewCancellation.mockReset().mockResolvedValue({
      refund_amount: '845',
      penalty_amount: '405',
      refund_type: 'partial',
      eligible_until: null,
      policy_applied: '30% penalty',
      change_allowed: true,
      reasons: []
    })
    confirmCancellation.mockReset().mockResolvedValue({
      status_after: 'cancel_requested'
    })
    pollReservationUntilFinal.mockReset().mockResolvedValue({
      state: 'completed',
      reservation: {
        id: 'res-123',
        status: 'refund_completed',
        total_price: '1200',
        currency: 'COP',
        check_in_date: '2026-10-12T00:00:00.000Z',
        check_out_date: '2026-10-15T00:00:00.000Z',
        number_of_guests: 2,
        created_at: '2026-09-01T00:00:00.000Z'
      },
      attempts: 2
    })
  })

  it('renders cancellation page with refund breakdown', async () => {
    const wrapper = await mountSuspended(ReservationCancelPage, {
      route: {
        params: { id: 'res-123' }
      }
    })

    const text = wrapper.text()

    expect(text).toMatch(/Cancel your stay|Cancela tu estadía|Cancele sua estadia/)
    expect(text).toMatch(/Refund breakdown|Desglose de reembolso|Resumo do reembolso/)
    expect(previewCancellation).toHaveBeenCalled()
  })
})
