import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useAuthStore } from '~/stores/auth'

const mockListHostReservations = vi.fn()
const mockGetHostMetrics = vi.fn()
const mockGetRevenueTrends = vi.fn()

vi.mock('~/services/hostReservationsService', () => ({
  listHostReservations: (...args: unknown[]) => mockListHostReservations(...args),
  getHostMetrics: (...args: unknown[]) => mockGetHostMetrics(...args),
  getRevenueTrends: (...args: unknown[]) => mockGetRevenueTrends(...args),
}))

function harness(setupFn: () => Record<string, unknown>) {
  return defineComponent({
    setup() {
      return setupFn()
    },
    template: '<div>test</div>',
  })
}

describe('useHostReservations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockListHostReservations.mockReset()
    mockGetHostMetrics.mockReset()
    mockGetRevenueTrends.mockReset()
  })

  it('initializes with empty state', async () => {
    const Comp = harness(() => {
      const { reservations, metrics, trends, loading, error } = useHostReservations()
      return { reservations, metrics, trends, loading, error }
    })
    const wrapper = await mountSuspended(Comp)
    expect(wrapper.vm.reservations).toBeNull()
    expect(wrapper.vm.metrics).toBeNull()
    expect(wrapper.vm.trends).toBeNull()
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.error).toBeNull()
  })

  it('refreshReservations forwards token and filters and stores response', async () => {
    const page = { items: [], total: 0, page: 1, page_size: 10 }
    mockListHostReservations.mockResolvedValue(page)

    const Comp = harness(() => {
      useAuthStore().token = 'jwt-token'
      const api = useHostReservations()
      return api
    })
    const wrapper = await mountSuspended(Comp)

    await (wrapper.vm.refreshReservations as (f: object) => Promise<void>)({
      page: 2,
      sort_by: 'total_price',
    })

    expect(mockListHostReservations).toHaveBeenCalledWith('jwt-token', {
      page: 2,
      sort_by: 'total_price',
    })
    expect(wrapper.vm.reservations).toEqual(page)
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.error).toBeNull()
  })

  it('refreshReservations captures error message', async () => {
    mockListHostReservations.mockRejectedValue({ message: 'errors.unauthorized' })

    const Comp = harness(() => useHostReservations())
    const wrapper = await mountSuspended(Comp)

    await (wrapper.vm.refreshReservations as (f: object) => Promise<void>)({})

    expect(wrapper.vm.error).toBe('errors.unauthorized')
    expect(wrapper.vm.loading).toBe(false)
  })

  it('refreshMetrics stores metrics response', async () => {
    const metrics = {
      active_reservations: 5,
      occupancy_rate: 0.42,
      revenue_amount: '1234.50',
      revenue_currency: 'cop',
      average_daily_rate: '200.00',
      total_nights: 10,
    }
    mockGetHostMetrics.mockResolvedValue(metrics)

    const Comp = harness(() => useHostReservations())
    const wrapper = await mountSuspended(Comp)

    await (wrapper.vm.refreshMetrics as (r: object) => Promise<void>)({
      start_date: '2026-04-01',
    })

    expect(mockGetHostMetrics).toHaveBeenCalled()
    expect(wrapper.vm.metrics).toEqual(metrics)
  })

  it('refreshTrends stores buckets', async () => {
    const trends = { granularity: 'week', currency: 'cop', buckets: [] }
    mockGetRevenueTrends.mockResolvedValue(trends)

    const Comp = harness(() => useHostReservations())
    const wrapper = await mountSuspended(Comp)

    await (wrapper.vm.refreshTrends as (r: object) => Promise<void>)({
      granularity: 'week',
    })

    expect(mockGetRevenueTrends).toHaveBeenCalled()
    expect(wrapper.vm.trends).toEqual(trends)
  })
})
