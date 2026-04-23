import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReservationsPage from '~/pages/reservations/index.vue'

const mockGetReservationsByUser = vi.fn()

vi.mock('~/composables/useReservations', () => ({
  useReservations: () => ({
    getReservationsByUser: mockGetReservationsByUser,
    loading: { value: false },
    error: { value: null }
  })
}))

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    userId: 'traveler-123',
    email: 'alex.johnson@example.com',
    logout: vi.fn()
  })
}))

describe('ReservationsPage', () => {
  beforeEach(() => {
    mockGetReservationsByUser.mockReset().mockResolvedValue([
      {
        id: 'reservation-123',
        property_name: 'Oceanview Resort & Spa',
        property_cover_image_url: '/mock/property-1.svg',
        reservation: {
          id: 'reservation-123',
          id_traveler: 'traveler-123',
          id_property: 'prop-1',
          id_room: 'room-1',
          status: 'confirmed',
          total_price: '1245.00',
          currency: 'USD',
          check_in_date: '2026-10-12T00:00:00.000Z',
          check_out_date: '2026-10-15T00:00:00.000Z',
          number_of_guests: 2,
          version: 1,
          created_at: '2026-09-01T00:00:00.000Z',
          updated_at: '2026-09-01T00:00:00.000Z'
        }
      },
      {
        id: 'reservation-456',
        property_name: 'Mountain View Chalet',
        property_cover_image_url: '/mock/property-2.svg',
        reservation: {
          id: 'reservation-456',
          id_traveler: 'traveler-123',
          id_property: 'prop-2',
          id_room: 'room-2',
          status: 'confirmed',
          total_price: '3400.00',
          currency: 'USD',
          check_in_date: '2026-11-12T00:00:00.000Z',
          check_out_date: '2026-11-17T00:00:00.000Z',
          number_of_guests: 4,
          version: 1,
          created_at: '2026-09-04T00:00:00.000Z',
          updated_at: '2026-09-04T00:00:00.000Z'
        }
      }
    ])
  })

  it('shows the reservations dashboard and loads the user reservations', async () => {
    const wrapper = await mountSuspended(ReservationsPage, {
      route: {
        path: '/reservations'
      }
    })

    await new Promise(resolve => setTimeout(resolve, 0))
    const text = wrapper.text()

    expect(mockGetReservationsByUser).toHaveBeenCalledWith('traveler-123')
    expect(text).toMatch(/Reservation Management|Gestión de reservas|Gerenciamento de reservas/)
    expect(text).toContain('Oceanview Resort & Spa')
    expect(text).toContain('Mountain View Chalet')
    expect(text).toMatch(/Cancel Reservation|Cancelar reserva/)
  })
})
