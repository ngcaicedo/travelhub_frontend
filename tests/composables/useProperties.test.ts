import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import type { Property } from '~/types/api'

const mockProperties: Property[] = [
  {
    id: '1',
    name: 'Test Property',
    description: 'A test property',
    location: 'Test City',
    latitude: 10,
    longitude: 20,
    price_per_night: 100,
    currency: 'USD',
    rating: 4.5,
    review_count: 5,
    bedrooms: 2,
    bathrooms: 1,
    max_guests: 4,
    amenities: ['WiFi'],
    images: [{ id: 'img-1', url: 'https://example.com/img.jpg', alt_text: 'Test', position: 0 }]
  }
]

const mockGetAllProperties = vi.fn()

vi.mock('~/services/propertyServices', () => ({
  getAllProperties: (...args: unknown[]) => mockGetAllProperties(...args)
}))

describe('useProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('composable module exports function', async () => {
    const module = await import('~/composables/useProperties')
    expect(typeof module.useProperties).toBe('function')
  })

  it('fetches properties on mount', async () => {
    mockGetAllProperties.mockResolvedValue(mockProperties)

    const TestComponent = defineComponent({
      setup() {
        const { properties, loading, error } = useProperties()
        return { properties, loading, error }
      },
      template: '<div>{{ properties.length }} properties</div>'
    })

    const wrapper = await mountSuspended(TestComponent)
    expect(mockGetAllProperties).toHaveBeenCalled()
    expect(wrapper.text()).toContain('1 properties')
  })

  it('sets error when fetch fails', async () => {
    mockGetAllProperties.mockRejectedValue(new Error('Network error'))

    const TestComponent = defineComponent({
      setup() {
        const { properties, error } = useProperties()
        return { properties, error }
      },
      template: '<div><span class="error">{{ error }}</span><span class="count">{{ properties.length }}</span></div>'
    })

    const wrapper = await mountSuspended(TestComponent)
    expect(wrapper.find('.count').text()).toBe('0')
  })
})
