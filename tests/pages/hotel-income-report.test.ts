import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'

import HotelIncomeReportPage from '~/pages/hotel/reports/income.vue'

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    token: 'jwt-token',
    isAuthenticated: true,
    isHotelUser: true,
    role: 'hotel_admin',
  }),
}))

const loadMock = vi.fn()
const paramsRef = ref({ year: 2026, month: 5, currency: undefined as string | undefined })
const comparisonRef = ref<object | null>(null)
const trendsRef = ref<object | null>(null)
const loadingRef = ref(false)
const errorRef = ref<string | null>(null)

vi.mock('~/composables/useIncomeReport', () => ({
  useIncomeReport: () => ({
    params: paramsRef,
    comparison: comparisonRef,
    trends: trendsRef,
    loading: loadingRef,
    error: errorRef,
    load: loadMock,
  }),
}))

const baseComparison = {
  current: {
    active_reservations: 5,
    occupancy_rate: 0.75,
    revenue_amount: '1000000.00',
    revenue_currency: 'COP',
    available_currencies: ['COP'],
    average_daily_rate: '333333.33',
    total_nights: 15,
  },
  previous: {
    active_reservations: 3,
    occupancy_rate: 0.60,
    revenue_amount: '800000.00',
    revenue_currency: 'COP',
    available_currencies: ['COP'],
    average_daily_rate: '266666.67',
    total_nights: 12,
  },
  change_percent: 25,
}

const baseTrends = {
  granularity: 'day',
  currency: 'COP',
  available_currencies: ['COP'],
  buckets: [
    { bucket: '2026-05-01', revenue: '500000', reservations: 3 },
  ],
}

describe('hotel/reports/income.vue', () => {
  beforeEach(() => {
    loadMock.mockReset()
    comparisonRef.value = null
    trendsRef.value = null
    loadingRef.value = false
    errorRef.value = null
    paramsRef.value = { year: 2026, month: 5, currency: undefined }
  })

  it('calls load() on mount', async () => {
    await mountSuspended(HotelIncomeReportPage)
    expect(loadMock).toHaveBeenCalledOnce()
  })

  it('renders the page title', async () => {
    const wrapper = await mountSuspended(HotelIncomeReportPage)
    expect(wrapper.text()).toContain('Income Report')
  })

  it('renders the MonthYearPicker', async () => {
    const wrapper = await mountSuspended(HotelIncomeReportPage)
    expect(wrapper.find('[data-testid="income-year-select"]').exists()).toBe(true)
  })

  it('renders the RevenueSummaryCard', async () => {
    const wrapper = await mountSuspended(HotelIncomeReportPage)
    expect(wrapper.find('[data-testid="income-summary-card"]').exists()).toBe(true)
  })

  it('shows error alert when error is set', async () => {
    errorRef.value = 'API failure'
    const wrapper = await mountSuspended(HotelIncomeReportPage)
    expect(wrapper.text()).toContain('Could not load the income report.')
  })

  it('calls load() again when year changes', async () => {
    const wrapper = await mountSuspended(HotelIncomeReportPage)
    loadMock.mockClear()

    paramsRef.value.year = 2025
    await nextTick()
    await nextTick()

    expect(loadMock).toHaveBeenCalled()
  })

  it('calls load() again when month changes', async () => {
    const wrapper = await mountSuspended(HotelIncomeReportPage)
    loadMock.mockClear()

    paramsRef.value.month = null
    await nextTick()
    await nextTick()

    expect(loadMock).toHaveBeenCalled()
  })
})
