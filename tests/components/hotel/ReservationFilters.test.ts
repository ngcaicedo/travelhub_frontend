import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReservationFilters from '~/components/hotel/ReservationFilters.vue'
import type { HostReservationsFilters } from '~/types/hotel'

describe('HotelReservationFilters', () => {
  const defaultFilters: HostReservationsFilters = {
    status: ['confirmed'],
    start_date: '2026-04-01',
    end_date: '2026-04-30',
    guest_name: 'ana',
    sort_by: 'check_in_date',
    sort_dir: 'desc',
    page: 1,
    page_size: 10,
  }

  it('emits update:modelValue with current values when apply is clicked', async () => {
    const wrapper = await mountSuspended(ReservationFilters, {
      props: { modelValue: defaultFilters },
    })
    const buttons = wrapper.findAll('button')
    const applyBtn = buttons[buttons.length - 1]
    await applyBtn?.trigger('click')

    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect(events![0]![0]).toMatchObject({
      guest_name: 'ana',
      start_date: '2026-04-01',
      end_date: '2026-04-30',
    })
  })

  it('emits cleared filters when clear is clicked', async () => {
    const wrapper = await mountSuspended(ReservationFilters, {
      props: { modelValue: defaultFilters },
    })
    const buttons = wrapper.findAll('button')
    // Clear is the second-to-last button (apply is last).
    const clearBtn = buttons[buttons.length - 2]
    await clearBtn?.trigger('click')

    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeTruthy()
    const payload = events![0]![0] as HostReservationsFilters
    expect(payload.status).toEqual([])
    expect(payload.guest_name).toBe('')
    // Date range is now a global control outside this component, so dates pass through unchanged.
    expect(payload.start_date).toBe('2026-04-01')
    expect(payload.end_date).toBe('2026-04-30')
  })
})
