import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, computed } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import HotelDashboardPage from '~/pages/hotel/dashboard.vue'

const refreshReservationsMock = vi.fn()
const refreshMetricsMock = vi.fn()
const refreshTrendsMock = vi.fn()
const confirmHotelReservationMock = vi.fn()
const cancelHotelReservationMock = vi.fn()

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    token: 'jwt-token',
    isAuthenticated: true,
    isHotelUser: true,
  })
}))

const reservationsState = ref({
  items: [
    {
      id: 'res-1',
      reservation_number: 'RES-1',
      id_property: 'prop-1',
      id_room: 'room-1',
      id_traveler: 'trav-1',
      guest_full_name: 'Ana García',
      room_type: 'Suite Deluxe',
      check_in_date: '2026-10-12T00:00:00.000Z',
      check_out_date: '2026-10-17T00:00:00.000Z',
      number_of_guests: 2,
      total_price: '357.00',
      currency: 'COP',
      status: 'pending_payment' as const,
      created_at: '2026-10-11T00:00:00.000Z'
    }
  ],
  total: 1,
  page: 1,
  page_size: 10,
})

const metricsState = ref({
  active_reservations: 1,
  occupancy_rate: 0.42,
  revenue_amount: '357.00',
  revenue_currency: 'COP',
  available_currencies: ['COP'],
  average_daily_rate: '178.50',
  total_nights: 5,
})

const trendsState = ref({
  granularity: 'week' as const,
  currency: 'COP',
  available_currencies: ['COP'],
  buckets: [],
})

vi.mock('~/composables/useHostReservations', () => ({
  useHostReservations: () => ({
    reservations: reservationsState,
    metrics: metricsState,
    trends: trendsState,
    loading: computed(() => false),
    error: ref<string | null>(null),
    refreshReservations: refreshReservationsMock,
    refreshMetrics: refreshMetricsMock,
    refreshTrends: refreshTrendsMock,
  })
}))

vi.mock('~/services/reservationService', () => ({
  confirmHotelReservation: (...args: unknown[]) => confirmHotelReservationMock(...args),
  cancelHotelReservation: (...args: unknown[]) => cancelHotelReservationMock(...args),
}))

function includesAnyText(text: string, candidates: string[]) {
  return candidates.some(candidate => text.includes(candidate))
}

function findButtonByText(
  wrapper: Awaited<ReturnType<typeof mountSuspended>>,
  candidates: string[]
) {
  return wrapper.findAll('button').find((button: { text: () => string }) =>
    includesAnyText(button.text(), candidates)
  )
}

describe('HotelDashboardPage', () => {
  beforeEach(() => {
    refreshReservationsMock.mockReset().mockResolvedValue(undefined)
    refreshMetricsMock.mockReset().mockResolvedValue(undefined)
    refreshTrendsMock.mockReset().mockResolvedValue(undefined)
    confirmHotelReservationMock.mockReset().mockResolvedValue({})
    cancelHotelReservationMock.mockReset().mockResolvedValue({})
  })

  it('loads table reservations without applying dashboard date filters', async () => {
    await mountSuspended(HotelDashboardPage)

    expect(refreshReservationsMock).toHaveBeenCalled()
    expect(refreshReservationsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: [],
        guest_name: '',
        sort_by: 'check_in_date',
        sort_dir: 'desc',
        page: 1,
        page_size: 10,
      })
    )

    const firstCall = refreshReservationsMock.mock.calls[0]?.[0] ?? {}
    expect(firstCall).not.toHaveProperty('start_date')
    expect(firstCall).not.toHaveProperty('end_date')
  })

  it('renders actions and opens the cancel modal from the dashboard table', async () => {
    const wrapper = await mountSuspended(HotelDashboardPage)
    const cancelButton = findButtonByText(wrapper, ['Cancelar', 'Cancel'])

    expect(cancelButton).toBeTruthy()
    await cancelButton!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))

    const modalText = document.body.textContent || ''
    expect(modalText).toContain('Suite Deluxe')
    expect(includesAnyText(modalText, ['Confirmar cancelación', 'Confirm cancellation', 'Confirmar cancelamento'])).toBe(true)
  })

  it('confirms and cancels reservations from the dashboard table', async () => {
    const wrapper = await mountSuspended(HotelDashboardPage)
    const confirmButton = findButtonByText(wrapper, ['Confirmar', 'Confirm'])

    expect(confirmButton).toBeTruthy()
    await confirmButton!.trigger('click')

    expect(confirmHotelReservationMock).toHaveBeenCalledWith(
      'res-1',
      'jwt-token',
      expect.stringMatching(/manual hotel confirmation|confirmaci.n manual del hotel|confirma..o manual do hotel/i),
      expect.any(String)
    )

    const cancelButton = findButtonByText(wrapper, ['Cancelar', 'Cancel'])
    expect(cancelButton).toBeTruthy()
    await cancelButton!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))

    const confirmCancelButton = Array.from(document.querySelectorAll('button')).find(button =>
      includesAnyText(button.textContent || '', ['Confirmar cancelación', 'Confirm cancellation', 'Confirmar cancelamento'])
    ) as HTMLButtonElement | undefined

    expect(confirmCancelButton).toBeTruthy()
    confirmCancelButton?.click()

    expect(cancelHotelReservationMock).toHaveBeenCalledWith('res-1', 'jwt-token', 'maintenance', undefined, expect.any(String))
  })

  it('sends cancellation note even for predefined reasons', async () => {
    const wrapper = await mountSuspended(HotelDashboardPage)
    const cancelButton = findButtonByText(wrapper, ['Cancelar', 'Cancel'])

    expect(cancelButton).toBeTruthy()
    await cancelButton!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null
    expect(textarea).toBeTruthy()
    textarea!.value = 'Se detectó una inconsistencia operativa en la habitación.'
    textarea!.dispatchEvent(new Event('input'))

    const confirmCancelButton = Array.from(document.querySelectorAll('button')).find(button =>
      includesAnyText(button.textContent || '', ['Confirmar cancelaciÃ³n', 'Confirm cancellation', 'Confirmar cancelamento'])
    ) as HTMLButtonElement | undefined

    expect(confirmCancelButton).toBeTruthy()
    confirmCancelButton?.click()

    expect(cancelHotelReservationMock).toHaveBeenCalledWith(
      'res-1',
      'jwt-token',
      'maintenance',
      expect.stringContaining('Se detect'),
      'en'
    )
  })
})

