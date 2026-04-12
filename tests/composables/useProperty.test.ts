import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import type { Property } from '~/types/api'

const mockProperty: Property = {
  id: 'prop-1',
  name: 'Test Villa',
  description: 'A test villa',
  location: 'Beach City',
  latitude: 10,
  longitude: 20,
  price_per_night: 200,
  currency: 'USD',
  rating: 4.8,
  review_count: 12,
  bedrooms: 3,
  bathrooms: 2,
  max_guests: 6,
  amenities: ['Pool', 'WiFi'],
  images: [{ id: 'img-1', url: 'https://example.com/img.jpg', alt_text: 'Villa', position: 0 }]
}

const mockGetPropertyDetails = vi.fn()

vi.mock('~/services/propertyServices', () => ({
  getPropertyDetails: (...args: unknown[]) => mockGetPropertyDetails(...args)
}))

describe('useProperty', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('composable module exports function', async () => {
    const module = await import('~/composables/useProperty')
    expect(typeof module.useProperty).toBe('function')
  })

  it('fetches property details when id is provided', async () => {
    mockGetPropertyDetails.mockResolvedValue({
      property: mockProperty,
      reviews: []
    })

    const TestComponent = defineComponent({
      setup() {
        const { property, loading, error } = useProperty(ref('prop-1'))
        return { property, loading, error }
      },
      template: '<div>{{ property?.name || "loading" }}</div>'
    })

    const wrapper = await mountSuspended(TestComponent)
    expect(mockGetPropertyDetails).toHaveBeenCalledWith('prop-1')
    expect(wrapper.text()).toContain('Test Villa')
  })

  it('handles fetch error gracefully', async () => {
    mockGetPropertyDetails.mockRejectedValue(new Error('Not found'))

    const TestComponent = defineComponent({
      setup() {
        const { property, error } = useProperty(ref('bad-id'))
        return { property, error }
      },
      template: '<div><span class="name">{{ property?.name || "none" }}</span></div>'
    })

    const wrapper = await mountSuspended(TestComponent)
    expect(wrapper.find('.name').text()).toBe('none')
  })
})
