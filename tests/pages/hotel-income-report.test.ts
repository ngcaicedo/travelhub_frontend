import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'

import HotelIncomeReportPage from '~/pages/hotel/reports/income.vue'

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    token: 'jwt-token',
    isAuthenticated: true,
    isHotelUser: true,
    role: 'hotel',
  }),
}))

const loadMock = vi.fn()
const paramsRef = ref<{ year: number, month: number | null, currency: string | undefined }>({ year: 2026, month: 5, currency: undefined })
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
    await mountSuspended(HotelIncomeReportPage)
    loadMock.mockClear()

    paramsRef.value.year = 2025
    await nextTick()
    await nextTick()

    expect(loadMock).toHaveBeenCalled()
  })

  it('calls load() again when month changes', async () => {
    await mountSuspended(HotelIncomeReportPage)
    loadMock.mockClear()

    paramsRef.value.month = null
    await nextTick()
    await nextTick()

    expect(loadMock).toHaveBeenCalled()
  })
})
