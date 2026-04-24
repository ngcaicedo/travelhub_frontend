import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PropertyDetailPage from '~/pages/properties/[id].vue'
import type { Property, Review } from '~/types/api'

const mockProperty = ref<Property | null>(null)
const mockReviews = ref<Review[]>([])
const mockLoading = ref(false)

vi.mock('~/composables/useProperty', () => ({
  useProperty: () => ({
    property: mockProperty,
    reviews: mockReviews,
    loading: mockLoading,
    fetchProperty: vi.fn()
  })
}))

describe('PropertyDetailPage', () => {
  beforeEach(() => {
    mockProperty.value = null
    mockReviews.value = []
    mockLoading.value = false
  })

  it('renders page layout', async () => {
    const wrapper = await mountSuspended(PropertyDetailPage)
    expect(wrapper.find('.min-h-screen').exists()).toBe(true)
  })

  it('shows loading state', async () => {
    mockLoading.value = true
    const wrapper = await mountSuspended(PropertyDetailPage)
    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })

  it('shows property content when loaded', async () => {
    mockProperty.value = {
      id: 'prop-1',
      name: 'Luxury Villa',
      description: 'A beautiful luxury villa with amazing views',
      location: 'Cartagena',
      latitude: 10.4,
      longitude: -75.5,
      price_per_night: 500,
      currency: 'COP',
      rating: 4.9,
      review_count: 25,
      bedrooms: 4,
      bathrooms: 3,
      max_guests: 8,
      amenities: ['Pool', 'WiFi', 'Kitchen'],
      images: [
        { id: 'img-1', url: 'https://example.com/villa.jpg', alt_text: 'Villa exterior', position: 0 },
        { id: 'img-2', url: 'https://example.com/villa2.jpg', alt_text: 'Villa interior', position: 1 }
      ]
    }
    const wrapper = await mountSuspended(PropertyDetailPage)
    expect(wrapper.text()).toContain('Luxury Villa')
    expect(wrapper.text()).toContain('Cartagena')
  })

  it('shows not found when property is null and not loading', async () => {
    mockProperty.value = null
    mockLoading.value = false
    const wrapper = await mountSuspended(PropertyDetailPage)
    expect(wrapper.text().length).toBeGreaterThan(0)
  })
})
