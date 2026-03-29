import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AuthLayout from '~/layouts/auth.vue'

describe('AuthLayout', () => {
  it('renders the header with AppLogo', async () => {
    const wrapper = await mountSuspended(AuthLayout)
    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.text()).toContain('TravelHub')
  })

  it('renders the language selector (USelect)', async () => {
    const wrapper = await mountSuspended(AuthLayout)
    // USelect renders as a custom component, not a native <select>
    const select = wrapper.find('[role="combobox"], select, button')
    expect(select.exists()).toBe(true)
  })

  it('renders the main content area', async () => {
    const wrapper = await mountSuspended(AuthLayout)
    expect(wrapper.find('main').exists()).toBe(true)
  })

  it('has a link to home on the logo', async () => {
    const wrapper = await mountSuspended(AuthLayout)
    const logoLink = wrapper.find('a[href="/"]')
    expect(logoLink.exists()).toBe(true)
  })
})
