import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PropertiesIndexPage from '~/pages/properties/index.vue'
import type { Property } from '~/types/api'

const mockProperties = ref<Property[]>([])
const mockLoading = ref(false)
const mockError = ref<string | null>(null)
const mockFetchProperties = vi.fn()

vi.mock('~/composables/useProperties', () => ({
  useProperties: () => ({
    properties: mockProperties,
    loading: mockLoading,
    error: mockError,
    fetchProperties: mockFetchProperties
  })
}))

describe('PropertiesIndexPage', () => {
  beforeEach(() => {
    mockProperties.value = []
    mockLoading.value = false
    mockError.value = null
    vi.clearAllMocks()
  })

  it('renders page layout', async () => {
    const wrapper = await mountSuspended(PropertiesIndexPage)
    expect(wrapper.find('.min-h-screen').exists()).toBe(true)
  })

  it('renders max-width container', async () => {
    const wrapper = await mountSuspended(PropertiesIndexPage)
    expect(wrapper.find('.max-w-7xl').exists()).toBe(true)
  })

  it('shows skeleton loaders when loading', async () => {
    mockLoading.value = true
    const wrapper = await mountSuspended(PropertiesIndexPage)
    expect(wrapper.findAll('.grid > div').length).toBe(4)
  })

  it('shows empty state when no properties', async () => {
    mockProperties.value = []
    mockLoading.value = false
    const wrapper = await mountSuspended(PropertiesIndexPage)
    expect(wrapper.text()).toContain('No properties available')
  })

  it('shows error state when error occurs', async () => {
    mockError.value = 'Something went wrong'
    const wrapper = await mountSuspended(PropertiesIndexPage)
    expect(wrapper.text()).toContain('Something went wrong')
  })

  it('renders property cards when properties exist', async () => {
    mockProperties.value = [
      {
        id: '1',
        name: 'Beach House',
        description: 'Nice beach house',
        location: 'Miami',
        latitude: 25.7,
        longitude: -80.1,
        price_per_night: 150,
        currency: 'USD',
        rating: 4.5,
        review_count: 10,
        bedrooms: 2,
        bathrooms: 1,
        max_guests: 4,
        amenities: ['WiFi'],
        images: [{ id: 'img-1', url: 'https://example.com/img.jpg', alt_text: 'Beach', position: 0 }]
      }
    ]
    const wrapper = await mountSuspended(PropertiesIndexPage)
    expect(wrapper.text()).toContain('Beach House')
  })
})
