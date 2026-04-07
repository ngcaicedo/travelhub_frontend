import { describe, it, expect, vi, beforeEach } from 'vitest'
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

  it('runs initial search with default values', async () => {
    await mountSuspended(SearchPage)

    expect(mockSearchProperties).toHaveBeenCalledTimes(1)
    const request = mockSearchProperties.mock.calls[0]?.[0]

    expect(request?.ciudad).toBe('Bogota')
    expect(request?.check_in).toBe('2026-04-10')
    expect(request?.check_out).toBe('2026-04-12')
    expect(request?.huespedes).toBe(2)
    expect(request?.page).toBe(1)
    expect(request?.page_size).toBe(8)
  })

  it('prevents submit when city is empty', async () => {
    const wrapper = await mountSuspended(SearchPage)
    const cityInput = wrapper.find('input[placeholder]')

    expect(cityInput.exists()).toBe(true)
    mockSearchProperties.mockClear()

    await cityInput.setValue('')
    await wrapper.find('form').trigger('submit')

    expect(mockSearchProperties).toHaveBeenCalledTimes(0)

    const validationMessage = wrapper.find('.text-error-600')
    expect(validationMessage.exists()).toBe(true)
    expect(validationMessage.text().trim().length).toBeGreaterThan(0)
  })
})
