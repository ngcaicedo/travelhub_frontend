import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import HotelReservationsPage from '~/pages/hotel/reservations.vue'

const navigateToMock = vi.fn().mockResolvedValue(undefined)

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    token: 'jwt-token',
    isAuthenticated: true,
    isHotelUser: true
  })
}))

vi.mock('~/services/propertyServices', () => ({
  getAllProperties: vi.fn().mockResolvedValue([
    { id: 'prop-1', name: 'Hotel Andes' }
  ])
}))

const getHotelReservationsMock = vi.fn()
const confirmHotelReservationMock = vi.fn()
const cancelHotelReservationMock = vi.fn()

vi.mock('~/services/reservationService', () => ({
  getHotelReservations: (...args: unknown[]) => getHotelReservationsMock(...args),
  confirmHotelReservation: (...args: unknown[]) => confirmHotelReservationMock(...args),
  cancelHotelReservation: (...args: unknown[]) => cancelHotelReservationMock(...args)
}))

vi.mock('#app', async () => {
  const actual = await vi.importActual<object>('#app')
  return {
    ...actual,
    navigateTo: navigateToMock
  }
})

describe('HotelReservationsPage', () => {
  beforeEach(() => {
    navigateToMock.mockClear()
    getHotelReservationsMock.mockReset().mockResolvedValue([
      {
        id: 'res-1',
        id_traveler: 'trav-1',
        id_property: 'prop-1',
        id_room: 'room-1',
        check_in_date: '2026-10-12T00:00:00.000Z',
        check_out_date: '2026-10-17T00:00:00.000Z',
        number_of_guests: 2,
        total_price: '357.00',
        currency: 'COP',
        status: 'pending_payment',
        hold_expires_at: '2026-10-12T00:15:00.000Z',
        created_at: '2026-10-11T00:00:00.000Z',
        updated_at: '2026-10-11T00:00:00.000Z'
      }
    ])
    confirmHotelReservationMock.mockReset().mockResolvedValue({})
    cancelHotelReservationMock.mockReset().mockResolvedValue({})
  })

  it('renders the hotel reservations dashboard', async () => {
    const wrapper = await mountSuspended(HotelReservationsPage)
    const text = wrapper.text()

    expect(text).toContain('Dashboard de reservas')
    expect(text).toContain('Hotel Andes')
    expect(text).toContain('Reserva res-1')
  })

  it('confirms a reservation from the dashboard', async () => {
    const wrapper = await mountSuspended(HotelReservationsPage)
    const button = wrapper.findAll('button').find(btn => btn.text().includes('Confirmar'))

    expect(button).toBeTruthy()
    await button!.trigger('click')

    expect(confirmHotelReservationMock).toHaveBeenCalledWith('res-1', 'jwt-token', 'confirmacion manual del hotel')
  })

  it('opens a cancellation modal with reservation summary', async () => {
    const wrapper = await mountSuspended(HotelReservationsPage)
    const cancelButton = wrapper.findAll('button').find(button => button.text().includes('Cancelar'))

    expect(cancelButton).toBeTruthy()
    await cancelButton!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(document.body.textContent).toContain('Confirmar Cancelación')
    expect(document.body.textContent).toContain('Resumen de la reserva')
    expect(document.body.textContent).toContain('Hotel Andes')
    expect(document.body.textContent).toContain('ID: #res-1')
  })

  it('cancels a reservation from the modal', async () => {
    const wrapper = await mountSuspended(HotelReservationsPage)
    const cancelButton = wrapper.findAll('button').find(button => button.text().includes('Cancelar'))

    expect(cancelButton).toBeTruthy()
    await cancelButton!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))

    const confirmCancelButton = Array.from(document.querySelectorAll('button')).find(button =>
      button.textContent?.includes('Confirmar Cancelación')
    ) as HTMLButtonElement | undefined

    expect(confirmCancelButton).toBeTruthy()
    confirmCancelButton?.click()

    expect(cancelHotelReservationMock).toHaveBeenCalledWith('res-1', 'jwt-token', 'maintenance', undefined)
  })
})
