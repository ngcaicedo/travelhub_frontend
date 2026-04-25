import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import ReservationConfirmationPage from '~/pages/reservations/[id].vue'

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    userId: 'traveler-1'
  })
}))

describe('ReservationConfirmationPage', () => {
  it('renders the reservation confirmation layout', async () => {
    const wrapper = await mountSuspended(ReservationConfirmationPage, {
      route: {
        params: { id: '11111111-1111-1111-1111-111111111111' }
      }
    })

    const text = wrapper.text()

    expect(text).toMatch(/Reserva confirmada|Booking Confirmed/)
    expect(text).toMatch(/Detalles de la reserva|Reservation details|Detalhes da reserva/)
    expect(text).toMatch(/Próximos pasos|Next steps|Próximos passos/)
    expect(text).toMatch(/Volver al inicio|Back to home|Voltar ao início/)
  })
})
