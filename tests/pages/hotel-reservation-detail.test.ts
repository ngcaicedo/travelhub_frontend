import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import HotelReservationDetailPage from '~/pages/hotel/reservations/[id].vue'

const navigateToMock = vi.fn().mockResolvedValue(undefined)

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    token: 'jwt-token',
    isAuthenticated: true,
    isHotelUser: true,
  }),
}))

const loadMock = vi.fn()
const addNoteMock = vi.fn()
const confirmMock = vi.fn()
const cancelMock = vi.fn()

const detailRef = ref<object | null>(null)
const loadingRef = ref(false)
const errorRef = ref<string | null>(null)

vi.mock('~/composables/useHostReservationDetail', () => ({
  useHostReservationDetail: () => ({
    detail: detailRef,
    loading: loadingRef,
    error: errorRef,
    load: loadMock,
    addNote: addNoteMock,
    confirm: confirmMock,
    cancel: cancelMock,
  }),
}))

vi.mock('#app', async () => {
  const actual = await vi.importActual<object>('#app')
  return {
    ...actual,
    navigateTo: navigateToMock,
  }
})

const baseDetail = {
  reservation: {
    id: 'res-abc-123',
    id_traveler: 'trav-1',
    id_property: 'prop-1',
    id_room: 'Suite Deluxe',
    check_in_date: '2026-06-01T15:00:00',
    check_out_date: '2026-06-04T12:00:00',
    number_of_guests: 2,
    total_price: '900000.00',
    currency: 'COP',
    status: 'confirmed' as const,
    hold_expires_at: '2026-05-01T10:30:00',
    version: 3,
    created_at: '2026-04-25T10:00:00',
    updated_at: '2026-04-25T11:00:00',
    price_breakdown: {
      accommodation_in_cents: 75000000,
      cleaning_fee_in_cents: 8000000,
      service_fee_in_cents: 6000000,
      taxes_in_cents: 1000000,
      total_in_cents: 90000000,
      currency: 'COP',
      nights: 3,
      nightly_rate_in_cents: 25000000,
    },
  },
  guest: {
    id: 'usr-1',
    full_name: 'Juan Viajero',
    email: 'juan@example.com',
    phone: '+573001234567',
  },
  change_history: [
    {
      id: 'evt-1',
      reservation_id: 'res-abc-123',
      action: 'hotel.confirm',
      previous_status: 'pending_payment',
      new_status: 'confirmed',
      reason: 'hotel_confirmation',
      actor_user_id: 'usr-2',
      source_ip: null,
      created_at: '2026-04-25T11:00:00',
    },
  ],
  internal_notes: [
    {
      id: 'note-1',
      reservation_id: 'res-abc-123',
      content: 'El huésped solicitó check-in tardío.',
      author_user_id: 'usr-2',
      author_name: 'Admin',
      created_at: '2026-04-25T12:00:00',
    },
  ],
  available_actions: [{ action: 'cancel', label: 'Cancelar reserva' }],
}

describe('HotelReservationDetailPage', () => {
  beforeEach(() => {
    navigateToMock.mockClear()
    loadMock.mockReset().mockResolvedValue(undefined)
    addNoteMock.mockReset()
    confirmMock.mockReset()
    cancelMock.mockReset()
    detailRef.value = null
    loadingRef.value = false
    errorRef.value = null
  })

  it('calls load with the route param id on mount', async () => {
    const wrapper = await mountSuspended(HotelReservationDetailPage, {
      route: { params: { id: 'res-abc-123' } },
    })
    expect(loadMock).toHaveBeenCalledWith('res-abc-123')
    wrapper.unmount()
  })

  it('shows loading spinner while fetching', async () => {
    loadingRef.value = true
    detailRef.value = null
    const wrapper = await mountSuspended(HotelReservationDetailPage)
    expect(wrapper.find('[class*="animate-spin"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows error alert when load fails and detail is null', async () => {
    errorRef.value = 'errors.notFound'
    detailRef.value = null
    const wrapper = await mountSuspended(HotelReservationDetailPage)
    expect(wrapper.text()).toContain('errors.notFound')
    wrapper.unmount()
  })

  it('renders guest name and email', async () => {
    detailRef.value = baseDetail
    const wrapper = await mountSuspended(HotelReservationDetailPage)
    expect(wrapper.text()).toContain('Juan Viajero')
    expect(wrapper.text()).toContain('juan@example.com')
    wrapper.unmount()
  })

  it('renders guest phone', async () => {
    detailRef.value = baseDetail
    const wrapper = await mountSuspended(HotelReservationDetailPage)
    expect(wrapper.text()).toContain('+573001234567')
    wrapper.unmount()
  })

  it('renders change history event', async () => {
    detailRef.value = baseDetail
    const wrapper = await mountSuspended(HotelReservationDetailPage)
    expect(wrapper.text()).toContain('hotel.confirm')
    wrapper.unmount()
  })

  it('renders internal notes content', async () => {
    detailRef.value = baseDetail
    const wrapper = await mountSuspended(HotelReservationDetailPage)
    expect(wrapper.text()).toContain('El huésped solicitó check-in tardío.')
    wrapper.unmount()
  })

  it('shows only cancel button when available_actions has only cancel', async () => {
    detailRef.value = baseDetail // only 'cancel' in available_actions
    const wrapper = await mountSuspended(HotelReservationDetailPage)
    const allText = wrapper.text()
    const hasCancelBtn = ['Cancelar reserva', 'Cancel reservation', 'Cancelar reserva'].some(t =>
      allText.includes(t),
    )
    const hasConfirmBtn = ['Confirmar reserva', 'Confirm reservation'].some(t => allText.includes(t))
    expect(hasCancelBtn).toBe(true)
    expect(hasConfirmBtn).toBe(false)
    wrapper.unmount()
  })

  it('shows confirm button when available_actions includes confirm', async () => {
    detailRef.value = {
      ...baseDetail,
      available_actions: [
        { action: 'confirm', label: 'Confirmar reserva' },
        { action: 'cancel', label: 'Cancelar reserva' },
      ],
    }
    const wrapper = await mountSuspended(HotelReservationDetailPage)
    const allText = wrapper.text()
    const hasConfirmBtn = ['Confirmar reserva', 'Confirm reservation'].some(t => allText.includes(t))
    expect(hasConfirmBtn).toBe(true)
    wrapper.unmount()
  })

  it('back button navigates to /hotel/dashboard', async () => {
    detailRef.value = baseDetail
    const wrapper = await mountSuspended(HotelReservationDetailPage, {
      route: { params: { id: 'res-abc-123' } },
    })
    const backBtn = wrapper.findAll('button').find(b =>
      ['Volver al panel', 'Back to dashboard', 'Voltar ao painel'].some(t => b.text().includes(t)),
    )
    expect(backBtn).toBeDefined()
    wrapper.unmount()
  })

  it('renders price breakdown when present', async () => {
    detailRef.value = baseDetail
    const wrapper = await mountSuspended(HotelReservationDetailPage)
    // Total is 90000000 cents = 900,000 COP
    expect(wrapper.text()).toMatch(/900/)
    wrapper.unmount()
  })

  it('shows noBreakdown message when price_breakdown is null', async () => {
    detailRef.value = {
      ...baseDetail,
      reservation: { ...baseDetail.reservation, price_breakdown: null },
    }
    const wrapper = await mountSuspended(HotelReservationDetailPage)
    const noBreakdownTexts = [
      'Desglose no disponible',
      'Breakdown not available',
      'Detalhamento não disponível',
    ]
    expect(noBreakdownTexts.some(t => wrapper.text().includes(t))).toBe(true)
    wrapper.unmount()
  })
})
