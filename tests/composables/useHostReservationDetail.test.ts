import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useAuthStore } from '~/stores/auth'

const mockGetHostReservationDetail = vi.fn()
const mockAddHostReservationNote = vi.fn()
const mockConfirmHotelReservation = vi.fn()
const mockCancelHotelReservation = vi.fn()

vi.mock('~/services/hostReservationsService', () => ({
  getHostReservationDetail: (...args: unknown[]) => mockGetHostReservationDetail(...args),
  addHostReservationNote: (...args: unknown[]) => mockAddHostReservationNote(...args),
}))

vi.mock('~/services/reservationService', () => ({
  confirmHotelReservation: (...args: unknown[]) => mockConfirmHotelReservation(...args),
  cancelHotelReservation: (...args: unknown[]) => mockCancelHotelReservation(...args),
}))

const baseDetail = {
  reservation: {
    id: 'res-1',
    id_traveler: 'trav-1',
    id_property: 'prop-1',
    id_room: 'room-1',
    check_in_date: '2026-06-01T15:00:00',
    check_out_date: '2026-06-04T12:00:00',
    number_of_guests: 2,
    total_price: '900000.00',
    currency: 'COP',
    status: 'confirmed',
    hold_expires_at: '2026-05-01T10:30:00',
    version: 3,
    created_at: '2026-04-25T10:00:00',
    updated_at: '2026-04-25T11:00:00',
    price_breakdown: null,
  },
  guest: { id: 'usr-1', full_name: 'Juan Viajero', email: 'juan@example.com', phone: null },
  change_history: [],
  internal_notes: [],
  available_actions: [{ action: 'cancel', label: 'Cancelar reserva' }],
}

function harness(setupFn: () => Record<string, unknown>) {
  return defineComponent({
    setup() {
      return setupFn()
    },
    template: '<div>test</div>',
  })
}

describe('useHostReservationDetail', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockGetHostReservationDetail.mockReset()
    mockAddHostReservationNote.mockReset()
    mockConfirmHotelReservation.mockReset()
    mockCancelHotelReservation.mockReset()
  })

  it('initializes with empty state', async () => {
    const Comp = harness(() => {
      const api = useHostReservationDetail()
      return { detail: api.detail, loading: api.loading, error: api.error }
    })
    const wrapper = await mountSuspended(Comp)
    expect(wrapper.vm.detail).toBeNull()
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.error).toBeNull()
  })

  it('load fetches detail and stores response', async () => {
    mockGetHostReservationDetail.mockResolvedValue(baseDetail)

    const Comp = harness(() => {
      useAuthStore().token = 'jwt-token'
      return useHostReservationDetail()
    })
    const wrapper = await mountSuspended(Comp)

    await (wrapper.vm.load as (id: string) => Promise<void>)('res-1')

    expect(mockGetHostReservationDetail).toHaveBeenCalledWith('jwt-token', 'res-1')
    expect(wrapper.vm.detail).toEqual(baseDetail)
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.error).toBeNull()
  })

  it('load captures error message', async () => {
    mockGetHostReservationDetail.mockRejectedValue({ message: 'errors.notFound' })

    const Comp = harness(() => useHostReservationDetail())
    const wrapper = await mountSuspended(Comp)

    await (wrapper.vm.load as (id: string) => Promise<void>)('missing')

    expect(wrapper.vm.error).toBe('errors.notFound')
    expect(wrapper.vm.detail).toBeNull()
  })

  it('addNote appends note to detail.internal_notes', async () => {
    mockGetHostReservationDetail.mockResolvedValue(baseDetail)
    const newNote = {
      id: 'note-1',
      reservation_id: 'res-1',
      content: 'Necesita cuna extra.',
      author_user_id: 'usr-2',
      author_name: null,
      created_at: '2026-04-25T13:00:00',
    }
    mockAddHostReservationNote.mockResolvedValue(newNote)

    const Comp = harness(() => {
      useAuthStore().token = 'jwt-token'
      return useHostReservationDetail()
    })
    const wrapper = await mountSuspended(Comp)
    await (wrapper.vm.load as (id: string) => Promise<void>)('res-1')

    const result = await (wrapper.vm.addNote as (id: string, c: string) => Promise<unknown>)(
      'res-1',
      'Necesita cuna extra.',
    )

    expect(result).toEqual(newNote)
    expect((wrapper.vm.detail as typeof baseDetail).internal_notes).toHaveLength(1)
    expect((wrapper.vm.detail as typeof baseDetail).internal_notes[0].content).toBe('Necesita cuna extra.')
  })

  it('addNote returns null and sets error on failure', async () => {
    mockGetHostReservationDetail.mockResolvedValue(baseDetail)
    mockAddHostReservationNote.mockRejectedValue({ message: 'errors.validation' })

    const Comp = harness(() => {
      useAuthStore().token = 'jwt-token'
      return useHostReservationDetail()
    })
    const wrapper = await mountSuspended(Comp)
    await (wrapper.vm.load as (id: string) => Promise<void>)('res-1')

    const result = await (wrapper.vm.addNote as (id: string, c: string) => Promise<unknown>)(
      'res-1',
      '',
    )

    expect(result).toBeNull()
    expect(wrapper.vm.error).toBe('errors.validation')
  })

  it('confirm calls confirmHotelReservation then reloads detail', async () => {
    mockGetHostReservationDetail.mockResolvedValue(baseDetail)
    mockConfirmHotelReservation.mockResolvedValue({})

    const Comp = harness(() => {
      useAuthStore().token = 'jwt-token'
      return useHostReservationDetail()
    })
    const wrapper = await mountSuspended(Comp)
    await (wrapper.vm.load as (id: string) => Promise<void>)('res-1')

    const ok = await (wrapper.vm.confirm as (id: string) => Promise<boolean>)('res-1')

    expect(ok).toBe(true)
    expect(mockConfirmHotelReservation).toHaveBeenCalledWith('res-1', 'jwt-token')
    // load called again after confirm
    expect(mockGetHostReservationDetail).toHaveBeenCalledTimes(2)
  })

  it('confirm returns false and sets error on failure', async () => {
    mockGetHostReservationDetail.mockResolvedValue(baseDetail)
    mockConfirmHotelReservation.mockRejectedValue({ message: 'errors.conflict' })

    const Comp = harness(() => {
      useAuthStore().token = 'jwt-token'
      return useHostReservationDetail()
    })
    const wrapper = await mountSuspended(Comp)
    await (wrapper.vm.load as (id: string) => Promise<void>)('res-1')

    const ok = await (wrapper.vm.confirm as (id: string) => Promise<boolean>)('res-1')

    expect(ok).toBe(false)
    expect(wrapper.vm.error).toBe('errors.conflict')
  })

  it('cancel calls cancelHotelReservation with reason then reloads', async () => {
    mockGetHostReservationDetail.mockResolvedValue(baseDetail)
    mockCancelHotelReservation.mockResolvedValue({})

    const Comp = harness(() => {
      useAuthStore().token = 'jwt-token'
      return useHostReservationDetail()
    })
    const wrapper = await mountSuspended(Comp)
    await (wrapper.vm.load as (id: string) => Promise<void>)('res-1')

    const ok = await (
      wrapper.vm.cancel as (id: string, r: string, n?: string) => Promise<boolean>
    )('res-1', 'hotel_policy')

    expect(ok).toBe(true)
    expect(mockCancelHotelReservation).toHaveBeenCalledWith('res-1', 'jwt-token', 'hotel_policy', undefined)
    expect(mockGetHostReservationDetail).toHaveBeenCalledTimes(2)
  })
})
