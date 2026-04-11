import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PropertiesIndexPage from '~/pages/properties/index.vue'

describe('PropertiesIndexPage', () => {
  it('renders page layout', async () => {
    const wrapper = await mountSuspended(PropertiesIndexPage)
    expect(wrapper.find('.min-h-screen').exists()).toBe(true)
  })

  it('renders grid container', async () => {
    const wrapper = await mountSuspended(PropertiesIndexPage)
    expect(wrapper.find('.grid').exists()).toBe(true)
  })

  it('renders max-width container', async () => {
    const wrapper = await mountSuspended(PropertiesIndexPage)
    expect(wrapper.find('.max-w-7xl').exists()).toBe(true)
  })
})
