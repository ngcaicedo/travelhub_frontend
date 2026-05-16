import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import HotelReservationsPage from '~/pages/hotel/reservations/index.vue'

const navigateToMock = vi.fn().mockResolvedValue(undefined)

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    token: 'jwt-token',
    isAuthenticated: true,
    isHotelUser: true,
    // Real auth store derives `userId` from the JWT claim `sub`. The page now
    // uses it to scope the property listing to the logged-in partner.
    userId: 'owner-1',
  }),
}))

vi.mock('~/services/propertyServices', () => ({
  // Both names are exported because some tests import the unscoped helper.
  getAllProperties: vi.fn().mockResolvedValue([
    { id: 'prop-1', name: 'Hotel Andes' },
  ]),
  getPropertiesByOwner: vi.fn().mockResolvedValue([
    { id: 'prop-1', name: 'Hotel Andes' },
  ]),
}))

const getHotelReservationsMock = vi.fn()
const cancelHotelReservationMock = vi.fn()

vi.mock('~/services/reservationService', () => ({
  getHotelReservations: (...args: unknown[]) => getHotelReservationsMock(...args),
  cancelHotelReservation: (...args: unknown[]) => cancelHotelReservationMock(...args),
}))

vi.mock('#app', async () => {
  const actual = await vi.importActual<object>('#app')
  return {
    ...actual,
    navigateTo: navigateToMock,
  }
})

const textMatchers = {
  dashboard: ['Dashboard de reservas', 'Reservations dashboard', 'Painel de reservas'],
  cancel: ['Cancelar', 'Cancel'],
  cancelModalTitle: ['Confirmar cancelaci�n', 'Confirm cancellation', 'Confirmar cancelamento'],
  reservationSummary: ['Resumen de la reserva', 'Reservation summary', 'Resumo da reserva'],
}

function includesAnyText(text: string, candidates: string[]) {
  return candidates.some(candidate => text.includes(candidate))
}

function findButtonByText(
  wrapper: Awaited<ReturnType<typeof mountSuspended>>,
  candidates: string[],
) {
  return wrapper.findAll('button').find((button: { text: () => string }) =>
    includesAnyText(button.text(), candidates),
  )
}

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
        updated_at: '2026-10-11T00:00:00.000Z',
        available_actions: [
          { action: 'confirm', label: 'Confirmar reserva' },
          { action: 'cancel', label: 'Cancelar reserva' },
        ],
      },
    ])
    cancelHotelReservationMock.mockReset().mockResolvedValue({})
  })

  it('renders the hotel reservations dashboard', async () => {
    const wrapper = await mountSuspended(HotelReservationsPage)
    const text = wrapper.text()

    expect(includesAnyText(text, textMatchers.dashboard)).toBe(true)
    expect(text).toContain('Hotel Andes')
    expect(text).toContain('res-1')
  })

  it('does not expose confirm action from the reservations list', async () => {
    const wrapper = await mountSuspended(HotelReservationsPage)
    expect(wrapper.text()).not.toMatch(/Confirmar reserva|Confirm reservation/)
  })

  it('opens a cancellation modal with reservation summary', async () => {
    const wrapper = await mountSuspended(HotelReservationsPage)
    const cancelButton = findButtonByText(wrapper, textMatchers.cancel)

    expect(cancelButton).toBeTruthy()
    await cancelButton!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))

    const modalText = document.body.textContent || ''
    expect(includesAnyText(modalText, textMatchers.cancelModalTitle)).toBe(true)
    expect(includesAnyText(modalText, textMatchers.reservationSummary)).toBe(true)
    expect(modalText).toContain('Hotel Andes')
    expect(modalText).toContain('ID: #res-1')
  })

  it('cancels a reservation from the modal', async () => {
    const wrapper = await mountSuspended(HotelReservationsPage)
    const cancelButton = findButtonByText(wrapper, textMatchers.cancel)

    expect(cancelButton).toBeTruthy()
    await cancelButton!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))

    const confirmCancelButton = Array.from(document.querySelectorAll('button')).find(button =>
      includesAnyText(button.textContent || '', textMatchers.cancelModalTitle),
    ) as HTMLButtonElement | undefined

    expect(confirmCancelButton).toBeTruthy()
    confirmCancelButton?.click()

    expect(cancelHotelReservationMock).toHaveBeenCalledWith('res-1', 'jwt-token', 'maintenance', undefined, expect.any(String))
  })

  it('passes cancellation note for predefined reasons', async () => {
    const wrapper = await mountSuspended(HotelReservationsPage)
    const cancelButton = findButtonByText(wrapper, textMatchers.cancel)

    expect(cancelButton).toBeTruthy()
    await cancelButton!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null
    expect(textarea).toBeTruthy()
    textarea!.value = 'Hubo un ajuste operativo interno.'
    textarea!.dispatchEvent(new Event('input'))

    const confirmCancelButton = Array.from(document.querySelectorAll('button')).find(button =>
      includesAnyText(button.textContent || '', textMatchers.cancelModalTitle),
    ) as HTMLButtonElement | undefined

    expect(confirmCancelButton).toBeTruthy()
    confirmCancelButton?.click()

    expect(cancelHotelReservationMock).toHaveBeenCalledWith(
      'res-1',
      'jwt-token',
      'maintenance',
      'Hubo un ajuste operativo interno.',
      expect.any(String),
    )
  })

  it('keeps modification confirmed visible but without confirm button in list', async () => {
    getHotelReservationsMock.mockReset().mockResolvedValue([
      {
        id: 'res-2',
        id_traveler: 'trav-2',
        id_property: 'prop-1',
        id_room: 'room-2',
        check_in_date: '2026-11-01T00:00:00.000Z',
        check_out_date: '2026-11-03T00:00:00.000Z',
        number_of_guests: 2,
        total_price: '410.00',
        currency: 'COP',
        status: 'modification_confirmed',
        hold_expires_at: '2026-11-01T00:15:00.000Z',
        created_at: '2026-10-20T00:00:00.000Z',
        updated_at: '2026-10-20T00:00:00.000Z',
        available_actions: [
          { action: 'confirm', label: 'Confirmar reserva' },
          { action: 'cancel', label: 'Cancelar reserva' },
        ],
      },
    ])

    const wrapper = await mountSuspended(HotelReservationsPage)
    const text = wrapper.text()

    expect(text).toMatch(/Modificaci.n confirmada|Modification confirmed|Modifica..o confirmada/)
    expect(text).not.toMatch(/Confirmar reserva|Confirm reservation/)
  })
})
