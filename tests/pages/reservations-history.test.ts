import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReservationsPage from '~/pages/reservations/index.vue'

const mockGetReservationsByUser = vi.fn()
const mockGetPropertyDetails = vi.fn()

vi.mock('~/composables/useReservations', () => ({
  useReservations: () => ({
    getReservationsByUser: mockGetReservationsByUser,
    loading: { value: false },
    error: { value: null }
  })
}))

vi.mock('~/services/propertyServices', () => ({
  getPropertyDetails: (...args: unknown[]) => mockGetPropertyDetails(...args)
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

    mockGetPropertyDetails.mockReset()
      .mockImplementation(async (propertyId: string) => ({
        property: {
          id: propertyId,
          name: propertyId === 'prop-1' ? 'Oceanview Resort & Spa' : 'Mountain View Chalet',
          description: 'Test property',
          location: propertyId === 'prop-1' ? 'Sorrento, Italy' : 'Aspen, USA',
          price_per_night: 100,
          currency: 'USD',
          rating: 4.9,
          review_count: 120,
          bedrooms: 2,
          bathrooms: 2,
          max_guests: 4,
          amenities: [],
          images: [{ id: `${propertyId}-img`, url: '/mock/property-1.svg', position: 1 }]
        },
        reviews: []
      }))
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
