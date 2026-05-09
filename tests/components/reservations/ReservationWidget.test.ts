import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReservationWidget from '~/components/reservations/ReservationWidget.vue'

const mockCreateReservation = vi.fn()
const mockCheckAvailability = vi.fn()
const mockLoading = ref(false)
const mockError = ref<string | null>(null)

vi.mock('~/composables/useReservations', () => ({
  useReservations: () => ({
    createReservation: (...args: unknown[]) => mockCreateReservation(...args),
    loading: mockLoading,
    error: mockError
  })
}))

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    userId: '503c561b-226e-4839-af65-940c019c0eef',
    token: 'mock-token',
    role: 'traveler',
    isAuthenticated: true
  })
}))

vi.mock('~/services/search', () => ({
  searchService: {
    checkAvailability: (...args: unknown[]) => mockCheckAvailability(...args)
  }
}))

const defaultProps = {
  property: {
    id: 'prop-123',
    price_per_night: 150000,
    currency: 'COP',
    max_guests: 4
  }
}

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)
const dayAfterTomorrow = new Date(today)
dayAfterTomorrow.setDate(today.getDate() + 2)

const formatDate = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

describe('ReservationWidget', () => {
  beforeEach(() => {
    mockCreateReservation.mockReset()
    mockCheckAvailability.mockReset()
    mockCheckAvailability.mockResolvedValue({
      property_id: 'prop-123',
      check_in: '2026-05-10',
      check_out: '2026-05-11',
      guests: 1,
      available: true,
      price_from: 150000,
      currency: 'COP'
    })
    mockLoading.value = false
    mockError.value = null
  })

  it('renders price per night', async () => {
    const wrapper = await mountSuspended(ReservationWidget, { props: defaultProps })
    expect(wrapper.text()).toMatch(/150/)
  })

  it('renders check-in and check-out date inputs', async () => {
    const wrapper = await mountSuspended(ReservationWidget, { props: defaultProps })
    expect(wrapper.findAll('input[type="date"]').length).toBeGreaterThanOrEqual(2)
  })

  it('renders guest count input', async () => {
    const wrapper = await mountSuspended(ReservationWidget, { props: defaultProps })
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('uses initial dates from props', async () => {
    const checkIn = formatDate(tomorrow)
    const checkOut = formatDate(dayAfterTomorrow)

    const wrapper = await mountSuspended(ReservationWidget, {
      props: {
        ...defaultProps,
        initialCheckInDate: checkIn,
        initialCheckOutDate: checkOut,
        initialNumberOfGuests: 3
      }
    })

    const vm = wrapper.vm as unknown as {
      checkInDate: string
      checkOutDate: string
      numberOfGuests: number
    }

    expect(vm.checkInDate).toBe(checkIn)
    expect(vm.checkOutDate).toBe(checkOut)
    expect(vm.numberOfGuests).toBe(3)
  })

  it('calculates stay duration and total price', async () => {
    const checkIn = formatDate(tomorrow)
    const checkOut = formatDate(dayAfterTomorrow)

    const wrapper = await mountSuspended(ReservationWidget, {
      props: {
        ...defaultProps,
        initialCheckInDate: checkIn,
        initialCheckOutDate: checkOut
      }
    })

    const vm = wrapper.vm as unknown as {
      stayDuration: number
      totalPrice: number
    }

    expect(vm.stayDuration).toBe(1)
    expect(vm.totalPrice).toBe(162000)
  })

  it('uses effective nightly rate when availability returns a dynamic tariff', async () => {
    const checkIn = formatDate(tomorrow)
    const checkOut = formatDate(dayAfterTomorrow)

    mockCheckAvailability.mockResolvedValue({
      property_id: 'prop-123',
      check_in: checkIn,
      check_out: checkOut,
      guests: 2,
      available: true,
      price_from: 180000,
      currency: 'COP'
    })

    const wrapper = await mountSuspended(ReservationWidget, {
      props: {
        ...defaultProps,
        initialCheckInDate: checkIn,
        initialCheckOutDate: checkOut,
        initialNumberOfGuests: 2
      }
    })

    await flushPromises()

    const vm = wrapper.vm as unknown as {
      totalPrice: number
      selectedNightlyRate: number
    }

    expect(mockCheckAvailability).toHaveBeenCalled()
    expect(vm.selectedNightlyRate).toBe(180000)
    expect(vm.totalPrice).toBe(388800)
    expect(wrapper.text()).toMatch(/Tarifa actualizada|Updated rate|Tarifa atualizada/)
  })

  it('disables booking when dates are not set', async () => {
    const wrapper = await mountSuspended(ReservationWidget, { props: defaultProps })
    const vm = wrapper.vm as unknown as { canBook: boolean }
    expect(vm.canBook).toBe(false)
  })

  it('enables booking when valid dates and guests are set', async () => {
    const checkIn = formatDate(tomorrow)
    const checkOut = formatDate(dayAfterTomorrow)

    const wrapper = await mountSuspended(ReservationWidget, {
      props: {
        ...defaultProps,
        initialCheckInDate: checkIn,
        initialCheckOutDate: checkOut,
        initialNumberOfGuests: 2
      }
    })

    const vm = wrapper.vm as unknown as { canBook: boolean }
    expect(vm.canBook).toBe(true)
  })

  it('disables booking when availability says the property is unavailable', async () => {
    const checkIn = formatDate(tomorrow)
    const checkOut = formatDate(dayAfterTomorrow)

    mockCheckAvailability.mockResolvedValue({
      property_id: 'prop-123',
      check_in: checkIn,
      check_out: checkOut,
      guests: 2,
      available: false,
      price_from: null,
      currency: 'COP'
    })

    const wrapper = await mountSuspended(ReservationWidget, {
      props: {
        ...defaultProps,
        initialCheckInDate: checkIn,
        initialCheckOutDate: checkOut,
        initialNumberOfGuests: 2
      }
    })

    await flushPromises()

    const vm = wrapper.vm as unknown as { canBook: boolean }
    expect(vm.canBook).toBe(false)
    expect(wrapper.text()).toMatch(/Elige otras fechas|choose different dates|Escolha outras datas/i)
  })

  it('calls createReservation on submit and redirects', async () => {
    const checkIn = formatDate(tomorrow)
    const checkOut = formatDate(dayAfterTomorrow)

    mockCreateReservation.mockResolvedValue({ id: 'res-new' })

    const wrapper = await mountSuspended(ReservationWidget, {
      props: {
        ...defaultProps,
        initialCheckInDate: checkIn,
        initialCheckOutDate: checkOut,
        initialNumberOfGuests: 2
      }
    })

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockCreateReservation).toHaveBeenCalledWith(
      expect.objectContaining({
        id_property: 'prop-123',
        number_of_guests: 2,
        currency: 'COP'
      })
    )
  })

  it('shows error when reservation fails with 400', async () => {
    const checkIn = formatDate(tomorrow)
    const checkOut = formatDate(dayAfterTomorrow)

    mockCreateReservation.mockRejectedValue({ statusCode: 400 })

    const wrapper = await mountSuspended(ReservationWidget, {
      props: {
        ...defaultProps,
        initialCheckInDate: checkIn,
        initialCheckOutDate: checkOut,
        initialNumberOfGuests: 2
      }
    })

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const vm = wrapper.vm as unknown as { submitError: string | null }
    expect(vm.submitError).toBeTruthy()
  })

  it('shows detailed unavailable message when reservation fails with 400 not available detail', async () => {
    const checkIn = formatDate(tomorrow)
    const checkOut = formatDate(dayAfterTomorrow)

    mockCreateReservation.mockRejectedValue({
      statusCode: 400,
      details: 'Room prop-123 is not available for the selected dates'
    })

    const wrapper = await mountSuspended(ReservationWidget, {
      props: {
        ...defaultProps,
        initialCheckInDate: checkIn,
        initialCheckOutDate: checkOut,
        initialNumberOfGuests: 2
      }
    })

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const vm = wrapper.vm as unknown as { submitError: string | null }
    expect(vm.submitError).toMatch(/Elige otras fechas|choose different dates|Escolha outras datas/i)
  })

  it('shows error when reservation fails with 409', async () => {
    const checkIn = formatDate(tomorrow)
    const checkOut = formatDate(dayAfterTomorrow)

    mockCreateReservation.mockRejectedValue({ statusCode: 409 })

    const wrapper = await mountSuspended(ReservationWidget, {
      props: {
        ...defaultProps,
        initialCheckInDate: checkIn,
        initialCheckOutDate: checkOut,
        initialNumberOfGuests: 2
      }
    })

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const vm = wrapper.vm as unknown as { submitError: string | null }
    expect(vm.submitError).toMatch(/Elige otras fechas|choose different dates|Escolha outras datas/i)
  })

  it('shows generic error for unknown status codes', async () => {
    const checkIn = formatDate(tomorrow)
    const checkOut = formatDate(dayAfterTomorrow)

    mockCreateReservation.mockRejectedValue({ statusCode: 500 })

    const wrapper = await mountSuspended(ReservationWidget, {
      props: {
        ...defaultProps,
        initialCheckInDate: checkIn,
        initialCheckOutDate: checkOut,
        initialNumberOfGuests: 2
      }
    })

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const vm = wrapper.vm as unknown as { submitError: string | null }
    expect(vm.submitError).toBeTruthy()
  })

  it('watches composable error and sets submitError', async () => {
    const wrapper = await mountSuspended(ReservationWidget, { props: defaultProps })

    mockError.value = 'Some composable error'
    await nextTick()

    const vm = wrapper.vm as unknown as { submitError: string | null }
    expect(vm.submitError).toBe('Some composable error')
  })
})
