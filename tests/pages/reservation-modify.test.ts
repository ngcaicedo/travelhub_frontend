import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReservationModifyPage from '~/pages/reservations/[id]/modify.vue'

const getReservation = vi.fn()
const previewModification = vi.fn()
const confirmModification = vi.fn()
const pollReservationUntilFinal = vi.fn()
const buildIdempotencyKey = vi.fn(() => 'reservation-modification-idem')

vi.mock('~/composables/useReservations', () => ({
  useReservations: () => ({
    getReservation,
    previewModification,
    confirmModification,
    pollReservationUntilFinal,
    buildIdempotencyKey
  })
}))

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    userId: 'traveler-1'
  })
}))

describe('ReservationModifyPage', () => {
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
    previewModification.mockReset().mockResolvedValue({
      reservation_before: {},
      reservation_after_preview: {},
      delta_amount: '200',
      requires_additional_charge: true,
      estimated_refund_amount: '0',
      policy_applied: 'Seasonal adjustment',
      change_allowed: true,
      reasons: []
    })
    confirmModification.mockReset().mockResolvedValue({
      status_before: 'confirmed',
      status_after: 'modification_pending_payment',
      action_applied: 'modification_confirmed'
    })
    pollReservationUntilFinal.mockReset().mockResolvedValue({
      state: 'completed',
      reservation: {
        id: 'res-123',
        status: 'modification_confirmed',
        total_price: '1200',
        currency: 'COP',
        check_in_date: '2026-10-13T00:00:00.000Z',
        check_out_date: '2026-10-16T00:00:00.000Z',
        number_of_guests: 2,
        created_at: '2026-09-01T00:00:00.000Z'
      },
      attempts: 2
    })
  })

  it('renders modification page and loads preview', async () => {
    const wrapper = await mountSuspended(ReservationModifyPage, {
      route: {
        params: { id: 'res-123' }
      }
    })

    const text = wrapper.text()

    expect(text).toMatch(/Modify reservation|Modificar reserva|Modificar reserva/)
    expect(text).toMatch(/Preview summary|Resumen del preview|Resumo do preview/)
    expect(getReservation).toHaveBeenCalled()
    expect(previewModification).toHaveBeenCalled()
  })
})
