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
})
