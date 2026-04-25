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

const upcomingReservation = {
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
}

const pastReservation = {
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
    check_in_date: '2025-11-12T00:00:00.000Z',
    check_out_date: '2025-11-17T00:00:00.000Z',
    number_of_guests: 4,
    version: 1,
    created_at: '2025-09-04T00:00:00.000Z',
    updated_at: '2025-09-04T00:00:00.000Z'
  }
}

const cancelledReservation = {
  id: 'reservation-789',
  property_name: 'Beach House',
  property_cover_image_url: '/mock/property-3.svg',
  reservation: {
    id: 'reservation-789',
    id_traveler: 'traveler-123',
    id_property: 'prop-3',
    id_room: 'room-3',
    status: 'cancelled',
    total_price: '800.00',
    currency: 'USD',
    check_in_date: '2026-12-01T00:00:00.000Z',
    check_out_date: '2026-12-05T00:00:00.000Z',
    number_of_guests: 2,
    version: 1,
    created_at: '2026-10-01T00:00:00.000Z',
    updated_at: '2026-10-01T00:00:00.000Z'
  }
}

describe('ReservationsPage', () => {
  beforeEach(() => {
    mockGetReservationsByUser.mockReset().mockResolvedValue([upcomingReservation, pastReservation])
  })

  it('shows the reservations dashboard and loads the user reservations', async () => {
    const wrapper = await mountSuspended(ReservationsPage, {
      route: { path: '/reservations' }
    })

    await new Promise(resolve => setTimeout(resolve, 0))
    const text = wrapper.text()

    expect(mockGetReservationsByUser).toHaveBeenCalledWith('traveler-123')
    expect(text).toMatch(/Reservation Management|Gestión de reservas|Gerenciamento de reservas/)
    expect(text).toContain('Oceanview Resort & Spa')
    expect(text).toMatch(/Cancel Reservation|Cancelar reserva/)
  })

  it('renders property name and image directly from response fields', async () => {
    const wrapper = await mountSuspended(ReservationsPage, {
      route: { path: '/reservations' }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    const article = wrapper.find('article')
    expect(article.text()).toContain('Oceanview Resort & Spa')

    const img = article.find('img')
    expect(img.attributes('src')).toBe('/mock/property-1.svg')
  })

  it('uses fallback mock image when property_cover_image_url is null', async () => {
    mockGetReservationsByUser.mockResolvedValue([
      { ...upcomingReservation, property_cover_image_url: null }
    ])

    const wrapper = await mountSuspended(ReservationsPage, {
      route: { path: '/reservations' }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    const img = wrapper.find('article img')
    expect(img.attributes('src')).toMatch(/^\/mock\/property-\d\.svg$/)
  })

  it('shows cancelled tab with count of cancelled reservations', async () => {
    mockGetReservationsByUser.mockResolvedValue([upcomingReservation, cancelledReservation])

    const wrapper = await mountSuspended(ReservationsPage, {
      route: { path: '/reservations' }
    })

    await new Promise(resolve => setTimeout(resolve, 0))
    const text = wrapper.text()

    expect(text).toMatch(/Cancelled|Canceladas|Canceladas/)
  })

  it('cancelled tab only shows cancelled reservations', async () => {
    mockGetReservationsByUser.mockResolvedValue([upcomingReservation, cancelledReservation])

    const wrapper = await mountSuspended(ReservationsPage, {
      route: { path: '/reservations' }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    const cancelledTabBtn = wrapper.findAll('button').find(btn =>
      /Cancelled|Canceladas/.test(btn.text())
    )
    expect(cancelledTabBtn).toBeTruthy()
    await cancelledTabBtn!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))

    const text = wrapper.text()
    expect(text).toContain('Beach House')
    expect(text).not.toContain('Oceanview Resort & Spa')
  })

  it('upcoming tab only shows upcoming reservations', async () => {
    mockGetReservationsByUser.mockResolvedValue([upcomingReservation, pastReservation])

    const wrapper = await mountSuspended(ReservationsPage, {
      route: { path: '/reservations' }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    const text = wrapper.text()
    expect(text).toContain('Oceanview Resort & Spa')
    expect(text).not.toContain('Mountain View Chalet')
  })

  it('clicking the card does not navigate (action lives on explicit buttons)', async () => {
    // Behavior intentionally removed in commit 0b47338 to keep the card surface
    // free of click hijacking; navigation now lives on the explicit modify /
    // detail buttons instead.
    const wrapper = await mountSuspended(ReservationsPage, {
      route: { path: '/reservations' }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    const pushSpy = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue(undefined)

    await wrapper.find('article').trigger('click')

    expect(pushSpy).not.toHaveBeenCalled()
  })

  it('clicking the modify button navigates to the modify page', async () => {
    const wrapper = await mountSuspended(ReservationsPage, {
      route: { path: '/reservations' }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    const pushSpy = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue(undefined)

    const modifyBtn = wrapper.findAll('button').find(btn =>
      /Modify|Modificar/.test(btn.text())
    )
    expect(modifyBtn).toBeTruthy()
    await modifyBtn!.trigger('click')

    expect(pushSpy).toHaveBeenCalledWith('/reservations/reservation-123/modify')
  })

  it('auto-selects past tab when there are no upcoming reservations', async () => {
    mockGetReservationsByUser.mockResolvedValue([pastReservation])

    const wrapper = await mountSuspended(ReservationsPage, {
      route: { path: '/reservations' }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('Mountain View Chalet')
  })

  it('auto-selects cancelled tab when there are only cancelled reservations', async () => {
    mockGetReservationsByUser.mockResolvedValue([cancelledReservation])

    const wrapper = await mountSuspended(ReservationsPage, {
      route: { path: '/reservations' }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('Beach House')
  })
})
