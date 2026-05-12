import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

const mockListSeasonalPricing = vi.fn()
const mockGetSeasonalPricing = vi.fn()
const mockCreateSeasonalPricing = vi.fn()
const mockUpdateSeasonalPricing = vi.fn()

vi.mock('~/services/seasonalPricingService', () => ({
  listSeasonalPricing: (...args: unknown[]) => mockListSeasonalPricing(...args),
  getSeasonalPricing: (...args: unknown[]) => mockGetSeasonalPricing(...args),
  createSeasonalPricing: (...args: unknown[]) => mockCreateSeasonalPricing(...args),
  updateSeasonalPricing: (...args: unknown[]) => mockUpdateSeasonalPricing(...args),
}))

function harness(setupFn: () => Record<string, unknown>) {
  return defineComponent({
    setup() {
      return setupFn()
    },
    template: '<div>test</div>',
  })
}

const baseRule = {
  id: 'sp-1',
  property_id: 'prop-1',
  season_start: '2026-12-01',
  season_end: '2027-01-10',
  price_per_night: 120,
  currency: 'USD',
  tax_rate: 0.19,
  cleaning_fee: 18,
  signature_hash: 'abc123',
  signature_algo: 'HMAC-SHA256',
  integrity_locked: false,
  integrity_checked_at: null,
  created_at: '2026-05-12T00:00:00Z',
  updated_at: '2026-05-12T00:00:00Z',
  integrity_valid: true,
}

describe('useSeasonalPricing', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockListSeasonalPricing.mockReset()
    mockGetSeasonalPricing.mockReset()
    mockCreateSeasonalPricing.mockReset()
    mockUpdateSeasonalPricing.mockReset()
  })

  it('loads list on mount when propertyId exists', async () => {
    mockListSeasonalPricing.mockResolvedValue([baseRule])

    const Comp = harness(() => {
      return useSeasonalPricing(ref('prop-1'))
    })

    const wrapper = await mountSuspended(Comp)

    expect(mockListSeasonalPricing).toHaveBeenCalledWith('prop-1')
    expect(wrapper.vm.items).toEqual([baseRule])
    expect(wrapper.vm.error).toBeNull()
  })

  it('loads detail when seasonalPriceId exists', async () => {
    mockListSeasonalPricing.mockResolvedValue([baseRule])
    mockGetSeasonalPricing.mockResolvedValue(baseRule)

    const Comp = harness(() => {
      return useSeasonalPricing(ref('prop-1'), ref('sp-1'))
    })

    const wrapper = await mountSuspended(Comp)

    expect(mockGetSeasonalPricing).toHaveBeenCalledWith('prop-1', 'sp-1')
    expect(wrapper.vm.selectedRule).toEqual(baseRule)
    expect((wrapper.vm.formDraft as { season_start: string }).season_start).toBe('2026-12-01')
  })

  it('disables edition when selected rule is locked', async () => {
    const lockedRule = { ...baseRule, integrity_locked: true }
    mockListSeasonalPricing.mockResolvedValue([lockedRule])
    mockGetSeasonalPricing.mockResolvedValue(lockedRule)

    const Comp = harness(() => {
      return useSeasonalPricing(ref('prop-1'), ref('sp-1'))
    })

    const wrapper = await mountSuspended(Comp)
    const result = await (wrapper.vm.submitUpdate as () => Promise<unknown>)()

    expect(wrapper.vm.canEdit).toBe(false)
    expect(result).toBeNull()
    expect(wrapper.vm.error).toBe('errors.locked')
  })

  it('maps 403, 404 and 423 service errors to UI keys', async () => {
    mockListSeasonalPricing
      .mockRejectedValueOnce({ statusCode: 403, message: 'errors.forbidden' })
      .mockRejectedValueOnce({ statusCode: 404, message: 'errors.notFound' })
      .mockRejectedValueOnce({ statusCode: 423 })

    const Comp = harness(() => {
      return useSeasonalPricing(ref('prop-1'))
    })

    const wrapper = await mountSuspended(Comp)
    expect(wrapper.vm.error).toBe('errors.forbidden')

    await (wrapper.vm.refresh as () => Promise<void>)()
    expect(wrapper.vm.error).toBe('errors.notFound')

    await (wrapper.vm.refresh as () => Promise<void>)()
    expect(wrapper.vm.error).toBe('errors.locked')
  })

  it('uses auth token when creating a rule', async () => {
    mockListSeasonalPricing.mockResolvedValue([])
    mockCreateSeasonalPricing.mockResolvedValue(baseRule)

    const Comp = harness(() => {
      useAuthStore().token = 'jwt-token'
      return useSeasonalPricing(ref('prop-1'))
    })

    const wrapper = await mountSuspended(Comp)
    await (wrapper.vm.submitCreate as (payload: object) => Promise<unknown>)({
      season_start: '2026-12-01',
      season_end: '2027-01-10',
      price_per_night: 120,
      currency: 'USD',
      tax_rate: 0.19,
      cleaning_fee: 18,
    })

    expect(mockCreateSeasonalPricing).toHaveBeenCalledWith(
      'prop-1',
      expect.objectContaining({ season_start: '2026-12-01' }),
      'jwt-token',
    )
  })
})
