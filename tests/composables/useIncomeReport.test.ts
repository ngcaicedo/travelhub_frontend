import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useAuthStore } from '~/stores/auth'

const mockGetHostMetrics = vi.fn()
const mockGetRevenueTrends = vi.fn()

vi.mock('~/services/hostReservationsService', () => ({
  getHostMetrics: (...args: unknown[]) => mockGetHostMetrics(...args),
  getRevenueTrends: (...args: unknown[]) => mockGetRevenueTrends(...args),
}))

const baseMetrics = {
  active_reservations: 5,
  occupancy_rate: 0.75,
  revenue_amount: '1000000.00',
  revenue_currency: 'COP',
  available_currencies: ['COP'],
  average_daily_rate: '333333.33',
  total_nights: 15,
}

const prevMetrics = {
  ...baseMetrics,
  revenue_amount: '800000.00',
}

const baseTrends = {
  granularity: 'day' as const,
  currency: 'COP',
  available_currencies: ['COP'],
  buckets: [
    { bucket: '2026-05-01', revenue: '500000', reservations: 3 },
    { bucket: '2026-05-15', revenue: '500000', reservations: 2 },
  ],
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function harness(setupFn: () => Record<string, any>) {
  return defineComponent({
    setup() {
      return setupFn()
    },
    template: '<div />',
  })
}

describe('useIncomeReport', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockGetHostMetrics.mockReset()
    mockGetRevenueTrends.mockReset()
    const store = useAuthStore()
    store.token = 'test-token'
  })

  it('initializes with current month and null data', async () => {
    const now = new Date()
    const wrapper = await mountSuspended(
      harness(() => {
        const { params, comparison, trends, loading } = useIncomeReport()
        return { params, comparison, trends, loading }
      }),
    )
    expect(wrapper.vm.params.year).toBe(now.getFullYear())
    expect(wrapper.vm.params.month).toBe(now.getMonth() + 1)
    expect(wrapper.vm.comparison).toBeNull()
    expect(wrapper.vm.trends).toBeNull()
    expect(wrapper.vm.loading).toBe(false)
  })

  it('load() calls getHostMetrics twice and getRevenueTrends once in parallel', async () => {
    mockGetHostMetrics.mockResolvedValue(baseMetrics)
    mockGetRevenueTrends.mockResolvedValue(baseTrends)

    const wrapper = await mountSuspended(
      harness(() => {
        const report = useIncomeReport()
        return report
      }),
    )

    await wrapper.vm.load()

    expect(mockGetHostMetrics).toHaveBeenCalledTimes(2)
    expect(mockGetRevenueTrends).toHaveBeenCalledTimes(1)
  })

  it('populates comparison and trends after load()', async () => {
    mockGetHostMetrics.mockResolvedValue(baseMetrics)
    mockGetRevenueTrends.mockResolvedValue(baseTrends)

    const wrapper = await mountSuspended(
      harness(() => useIncomeReport()),
    )

    await wrapper.vm.load()

    expect(wrapper.vm.comparison).not.toBeNull()
    expect(wrapper.vm.trends).not.toBeNull()
    expect(wrapper.vm.trends?.buckets).toHaveLength(2)
  })

  it('calculates positive change_percent correctly', async () => {
    mockGetHostMetrics
      .mockResolvedValueOnce(baseMetrics)
      .mockResolvedValueOnce(prevMetrics)
    mockGetRevenueTrends.mockResolvedValue(baseTrends)

    const wrapper = await mountSuspended(harness(() => useIncomeReport()))
    await wrapper.vm.load()

    // (1000000 - 800000) / 800000 * 100 = 25
    expect(wrapper.vm.comparison?.change_percent).toBeCloseTo(25, 1)
  })

  it('returns null change_percent when previous revenue is 0', async () => {
    mockGetHostMetrics
      .mockResolvedValueOnce(baseMetrics)
      .mockResolvedValueOnce({ ...prevMetrics, revenue_amount: '0.00' })
    mockGetRevenueTrends.mockResolvedValue(baseTrends)

    const wrapper = await mountSuspended(harness(() => useIncomeReport()))
    await wrapper.vm.load()

    expect(wrapper.vm.comparison?.change_percent).toBeNull()
  })

  it('sets error and clears data on API failure', async () => {
    mockGetHostMetrics.mockRejectedValue(new Error('Network error'))
    mockGetRevenueTrends.mockResolvedValue(baseTrends)

    const wrapper = await mountSuspended(harness(() => useIncomeReport()))
    await wrapper.vm.load()

    expect(wrapper.vm.error).toBe('Network error')
    expect(wrapper.vm.comparison).toBeNull()
    expect(wrapper.vm.trends).toBeNull()
  })

  it('uses month granularity when month is null (full year)', async () => {
    mockGetHostMetrics.mockResolvedValue(baseMetrics)
    mockGetRevenueTrends.mockResolvedValue({ ...baseTrends, granularity: 'month' })

    const wrapper = await mountSuspended(harness(() => useIncomeReport()))
    wrapper.vm.params.month = null
    await wrapper.vm.load()

    const trendsCall = mockGetRevenueTrends.mock.calls[0]
    expect(trendsCall?.[1]).toMatchObject({ granularity: 'month' })
  })

  it('uses day granularity when a specific month is selected', async () => {
    mockGetHostMetrics.mockResolvedValue(baseMetrics)
    mockGetRevenueTrends.mockResolvedValue(baseTrends)

    const wrapper = await mountSuspended(harness(() => useIncomeReport()))
    wrapper.vm.params.month = 5
    await wrapper.vm.load()

    const trendsCall = mockGetRevenueTrends.mock.calls[0]
    expect(trendsCall?.[1]).toMatchObject({ granularity: 'day' })
  })
})
