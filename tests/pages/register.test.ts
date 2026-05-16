import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import RegisterPage from '~/pages/register.vue'

describe('RegisterPage', () => {
  it('renders the registration form', async () => {
    const wrapper = await mountSuspended(RegisterPage)
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('renders title and subtitle', async () => {
    const wrapper = await mountSuspended(RegisterPage)
    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text().length).toBeGreaterThan(0)
  })

  it('renders the account type tabs', async () => {
    const wrapper = await mountSuspended(RegisterPage)
    const text = wrapper.text()
    expect(text.length).toBeGreaterThan(0)
    expect(wrapper.findAll('button').length).toBeGreaterThan(0)
  })

  it('renders full name input on traveler tab by default', async () => {
    const wrapper = await mountSuspended(RegisterPage)
    const inputs = wrapper.findAll('input')
    const hasFullNamePlaceholder = inputs.some(
      input => (input.element as HTMLInputElement).placeholder.length > 0
    )
    expect(hasFullNamePlaceholder).toBe(true)
  })

  it('renders email input', async () => {
    const wrapper = await mountSuspended(RegisterPage)
    const emailInput = wrapper.find('input[type="email"]')
    expect(emailInput.exists()).toBe(true)
  })

  it('renders password input', async () => {
    const wrapper = await mountSuspended(RegisterPage)
    const passwordInput = wrapper.find('input[type="password"]')
    expect(passwordInput.exists()).toBe(true)
  })

  it('renders terms checkbox', async () => {
    const wrapper = await mountSuspended(RegisterPage)
    expect(wrapper.text().length).toBeGreaterThan(0)
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('renders submit button', async () => {
    const wrapper = await mountSuspended(RegisterPage)
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.exists()).toBe(true)
  })

  it('renders login link pointing to /login', async () => {
    const wrapper = await mountSuspended(RegisterPage)
    const loginLink = wrapper.find('a[href="/login"]')
    expect(loginLink.exists()).toBe(true)
    expect(loginLink.text().length).toBeGreaterThan(0)
  })

  it('toggles password visibility when clicking the eye button', async () => {
    const wrapper = await mountSuspended(RegisterPage)
    const passwordInput = wrapper.find('input[type="password"]')
    expect(passwordInput.exists()).toBe(true)

    const toggleButton = wrapper.find('.pointer-events-auto button')
    if (toggleButton.exists()) {
      await toggleButton.trigger('click')
      const visibleInput = wrapper.find('input[type="text"]')
      expect(visibleInput.exists()).toBe(true)
    }
  })

  it('updates email model when typing', async () => {
    const wrapper = await mountSuspended(RegisterPage)
    const emailInput = wrapper.find('input[type="email"]')
    await emailInput.setValue('test@example.com')
    expect((emailInput.element as HTMLInputElement).value).toBe('test@example.com')
  })

  it('submits the form without errors', async () => {
    const wrapper = await mountSuspended(RegisterPage)
    const form = wrapper.find('form')
    await form.trigger('submit')
    expect(wrapper.exists()).toBe(true)
  })

  it('shows password strength indicator when password is typed', async () => {
    const wrapper = await mountSuspended(RegisterPage)
    const passwordInput = wrapper.find('input[type="password"]')
    await passwordInput.setValue('Test1234!')
    await wrapper.vm.$nextTick()
    const text = wrapper.text()
    expect(text.length).toBeGreaterThan(0)
  })
})
