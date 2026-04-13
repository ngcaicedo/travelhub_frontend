import { nextTick } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SearchPage from '~/pages/search.vue'
import type { SearchResponse } from '~/types/search'

const mockSearchProperties = vi.fn()
const mockResults = { value: null as SearchResponse | null }
const mockLoading = { value: false }
const mockError = { value: null as string | null }

vi.mock('~/composables/useSearch', () => ({
  useSearch: () => ({
    searchProperties: mockSearchProperties,
    results: mockResults,
    loading: mockLoading,
    error: mockError
  })
}))

const responseFixture: SearchResponse = {
  items: [],
  pagination: {
    total: 0,
    page: 1,
    page_size: 8,
    total_pages: 0
  },
  empty_state: []
}

describe('SearchPage', () => {
  beforeEach(() => {
    mockResults.value = responseFixture
    mockLoading.value = false
    mockError.value = null
    mockSearchProperties.mockReset()
    mockSearchProperties.mockResolvedValue(undefined)
  })

  it('renders search form', async () => {
    const wrapper = await mountSuspended(SearchPage)
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('does not run initial search without query params', async () => {
    await mountSuspended(SearchPage)

    expect(mockSearchProperties).toHaveBeenCalledTimes(0)
  })

  it('runs search with default values after submit', async () => {
    const wrapper = await mountSuspended(SearchPage)

    mockSearchProperties.mockClear()
    await wrapper.find('form').trigger('submit')

    expect(mockSearchProperties).toHaveBeenCalledTimes(1)
    const request = mockSearchProperties.mock.calls[0]?.[0]
    const checkInDate = request?.check_in ? new Date(`${request.check_in}T00:00:00`) : null
    const checkOutDate = request?.check_out ? new Date(`${request.check_out}T00:00:00`) : null

    expect(request?.city).toBe('Bogota')
    expect(request?.check_in).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(request?.check_out).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(checkInDate).not.toBeNull()
    expect(checkOutDate).not.toBeNull()
    expect(checkOutDate!.getTime()).toBeGreaterThan(checkInDate!.getTime())
    expect(request?.guests).toBe(2)
    expect(request?.page).toBe(1)
    expect(request?.page_size).toBe(8)
  })

  it('prevents submit when city is empty', async () => {
    const wrapper = await mountSuspended(SearchPage)
    await flushPromises()

    const vm = wrapper.vm as unknown as { searchState: { city: string } }

    mockSearchProperties.mockClear()

    vm.searchState.city = ''
    await nextTick()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockSearchProperties).toHaveBeenCalledTimes(0)

    const validationMessage = wrapper.find('.text-error-600')
    expect(validationMessage.exists()).toBe(true)
    expect(validationMessage.text().trim().length).toBeGreaterThan(0)
  })

  it('prevents submit when minPrice is not numeric', async () => {
    const wrapper = await mountSuspended(SearchPage)
    await flushPromises()

    const vm = wrapper.vm as unknown as { searchState: { minPrice: string } }

    vm.searchState.minPrice = 'abc'
    await nextTick()
    mockSearchProperties.mockClear()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockSearchProperties).toHaveBeenCalledTimes(0)

    const validationMessages = wrapper.findAll('.text-error-600')
    expect(validationMessages.some(message => message.text().includes('valid'))).toBe(true)
  })

  it('prevents submit when maxPrice is not numeric', async () => {
    const wrapper = await mountSuspended(SearchPage)
    await flushPromises()

    const vm = wrapper.vm as unknown as { searchState: { maxPrice: string } }
    vm.searchState.maxPrice = 'xyz'
    await nextTick()
    mockSearchProperties.mockClear()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockSearchProperties).toHaveBeenCalledTimes(0)
  })

  it('prevents submit when minPrice > maxPrice', async () => {
    const wrapper = await mountSuspended(SearchPage)
    await flushPromises()

    const vm = wrapper.vm as unknown as { searchState: { minPrice: string, maxPrice: string } }
    vm.searchState.minPrice = '500'
    vm.searchState.maxPrice = '100'
    await nextTick()
    mockSearchProperties.mockClear()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockSearchProperties).toHaveBeenCalledTimes(0)
  })

  it('prevents submit when checkOut is before checkIn', async () => {
    const wrapper = await mountSuspended(SearchPage)
    await flushPromises()

    const vm = wrapper.vm as unknown as { searchState: { checkIn: string, checkOut: string } }
    vm.searchState.checkIn = '2027-01-10'
    vm.searchState.checkOut = '2027-01-05'
    await nextTick()
    mockSearchProperties.mockClear()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockSearchProperties).toHaveBeenCalledTimes(0)
  })

  it('prevents submit when guests is less than 1', async () => {
    const wrapper = await mountSuspended(SearchPage)
    await flushPromises()

    const vm = wrapper.vm as unknown as { searchState: { guests: number } }
    vm.searchState.guests = 0
    await nextTick()
    mockSearchProperties.mockClear()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockSearchProperties).toHaveBeenCalledTimes(0)
  })

  it('renders results when search returns items', async () => {
    const fixtureWithResults: SearchResponse = {
      items: [
        {
          id: 'prop-1',
          name: 'Beach Resort',
          city: 'Cartagena',
          country: 'Colombia',
          rating: 4.5,
          max_capacity: 6,
          price_from: '250000',
          currency: 'COP',
          main_image_url: '/mock/property-1.svg',
          amenities: ['wifi', 'piscina']
        }
      ],
      pagination: {
        total: 1,
        page: 1,
        page_size: 8,
        total_pages: 1
      },
      empty_state: []
    }

    mockResults.value = fixtureWithResults

    const wrapper = await mountSuspended(SearchPage)
    const text = wrapper.text()

    expect(text).toContain('Beach Resort')
    expect(text).toContain('Cartagena')
  })

  it('shows empty state when search returns no items', async () => {
    const emptyFixture: SearchResponse = {
      items: [],
      pagination: {
        total: 0,
        page: 1,
        page_size: 8,
        total_pages: 0
      },
      empty_state: [{ code: 'no_results', message: 'No properties found' }]
    }

    mockResults.value = emptyFixture

    const wrapper = await mountSuspended(SearchPage)
    const text = wrapper.text()

    expect(text).toContain('No properties found')
  })

  it('shows error state when search has error', async () => {
    mockError.value = 'Network error occurred'
    mockResults.value = null

    const wrapper = await mountSuspended(SearchPage)
    const text = wrapper.text()

    expect(text).toContain('Network error occurred')
  })

  it('shows loading skeletons when loading', async () => {
    mockLoading.value = true
    mockResults.value = null

    const wrapper = await mountSuspended(SearchPage)
    // Should not show results or empty state while loading
    expect(wrapper.find('article').exists()).toBe(false)
  })

  it('renders pagination when there are multiple pages', async () => {
    const multiPageFixture: SearchResponse = {
      items: [
        {
          id: 'prop-1',
          name: 'Beach Resort',
          city: 'Cartagena',
          country: 'Colombia',
          rating: 4.5,
          max_capacity: 6,
          price_from: '250000',
          currency: 'COP',
          main_image_url: '/mock/property-1.svg',
          amenities: ['wifi']
        }
      ],
      pagination: {
        total: 20,
        page: 1,
        page_size: 8,
        total_pages: 3
      },
      empty_state: []
    }

    mockResults.value = multiPageFixture

    const wrapper = await mountSuspended(SearchPage)
    const text = wrapper.text()

    // Should show pagination summary
    expect(text).toMatch(/1.*3/)
  })

  it('toggles amenity selection', async () => {
    const wrapper = await mountSuspended(SearchPage)

    const vm = wrapper.vm as unknown as { selectedAmenities: string[], toggleAmenity: (id: string) => void }

    vm.toggleAmenity('wifi')
    expect(vm.selectedAmenities).toContain('wifi')

    vm.toggleAmenity('wifi')
    expect(vm.selectedAmenities).not.toContain('wifi')
  })

  it('hydrates from query params on mount', async () => {
    const wrapper = await mountSuspended(SearchPage, {
      route: {
        query: {
          city: 'Medellin',
          check_in: '2027-01-10',
          check_out: '2027-01-15',
          guests: '3',
          sort: 'price_asc',
          page: '2'
        }
      }
    })
    await flushPromises()

    const vm = wrapper.vm as unknown as { searchState: { city: string, sort: string } }
    expect(vm.searchState.city).toBe('Medellin')
    expect(vm.searchState.sort).toBe('price_asc')
  })

  it('prevents submit when negative minPrice', async () => {
    const wrapper = await mountSuspended(SearchPage)
    await flushPromises()

    const vm = wrapper.vm as unknown as { searchState: { minPrice: string } }
    vm.searchState.minPrice = '-50'
    await nextTick()
    mockSearchProperties.mockClear()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockSearchProperties).toHaveBeenCalledTimes(0)
  })
})
