import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppLogo from '~/components/AppLogo.vue'

describe('AppLogo', () => {
  it('renders the TravelHub text', async () => {
    const wrapper = await mountSuspended(AppLogo)
    expect(wrapper.text()).toContain('TravelHub')
  })

  it('renders the SVG icon', async () => {
    const wrapper = await mountSuspended(AppLogo)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('contains the airplane path in the SVG', async () => {
    const wrapper = await mountSuspended(AppLogo)
    const paths = wrapper.findAll('path')
    expect(paths.length).toBeGreaterThan(0)
  })
})
