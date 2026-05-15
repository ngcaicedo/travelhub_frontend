import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import HotelDashboardPage from '~/pages/hotel/dashboard.vue'

vi.mock('~/composables/useHostReservations', () => ({
  useHostReservations: () => ({
    reservations: ref({ items: [], total: 0, page: 1, page_size: 10 }),
    metrics: ref({
      active_reservations: 0,
      occupancy_rate: 0,
      revenue_amount: '0',
      revenue_currency: 'COP',
      available_currencies: ['COP'],
      average_daily_rate: '0',
      total_nights: 0,
    }),
    trends: ref({
      granularity: 'week',
      currency: 'COP',
      available_currencies: ['COP'],
      buckets: [],
    }),
    loading: ref(false),
    error: ref(null),
    refreshReservations: vi.fn(),
    refreshMetrics: vi.fn(),
    refreshTrends: vi.fn(),
  }),
}))

describe('hotel pricing navigation', () => {
  it('renders dashboard CTA that links to pricing section', async () => {
    const wrapper = await mountSuspended(HotelDashboardPage)
    const pricingLink = wrapper.find('a[href="/hotel/pricing"]')

    expect(pricingLink.exists()).toBe(true)
    expect(wrapper.text()).toMatch(/(manage|gestionar|gerenciar).*(pricing|precios|preços)/i)
  })
})
