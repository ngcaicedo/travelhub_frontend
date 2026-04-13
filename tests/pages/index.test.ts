import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import IndexPage from '~/pages/index.vue'

describe('IndexPage', () => {
  it('renders without errors', async () => {
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders an empty div as placeholder while redirecting', async () => {
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.find('div').exists()).toBe(true)
  })
})
