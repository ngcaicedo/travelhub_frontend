import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PropertyDetailPage from '~/pages/properties/[id].vue'

describe('PropertyDetailPage', () => {
  it('renders page layout', async () => {
    const wrapper = await mountSuspended(PropertyDetailPage)
    expect(wrapper.find('.min-h-screen').exists()).toBe(true)
  })
})
