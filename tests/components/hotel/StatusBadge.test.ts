import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import StatusBadge from '~/components/hotel/StatusBadge.vue'

describe('HotelStatusBadge', () => {
  it('renders the translated label for confirmed status', async () => {
    const wrapper = await mountSuspended(StatusBadge, {
      props: { status: 'confirmed' },
    })
    expect(wrapper.text().toLowerCase()).toMatch(/confirm/)
  })

  it('renders for pending_payment status', async () => {
    const wrapper = await mountSuspended(StatusBadge, {
      props: { status: 'pending_payment' },
    })
    expect(wrapper.text().length).toBeGreaterThan(0)
  })

  it('renders for cancelled status', async () => {
    const wrapper = await mountSuspended(StatusBadge, {
      props: { status: 'cancelled' },
    })
    expect(wrapper.text().toLowerCase()).toMatch(/cancel/)
  })

  it('renders for completed status', async () => {
    const wrapper = await mountSuspended(StatusBadge, {
      props: { status: 'completed' },
    })
    expect(wrapper.text().length).toBeGreaterThan(0)
  })
})
