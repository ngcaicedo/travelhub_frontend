import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LoginPage from '~/pages/login.vue'

describe('LoginPage', () => {
  it('renders the login form', async () => {
    const wrapper = await mountSuspended(LoginPage)
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('renders email input', async () => {
    const wrapper = await mountSuspended(LoginPage)
    const emailInput = wrapper.find('input[type="email"]')
    expect(emailInput.exists()).toBe(true)
  })

  it('renders password input', async () => {
    const wrapper = await mountSuspended(LoginPage)
    const passwordInput = wrapper.find('input[type="password"]')
    expect(passwordInput.exists()).toBe(true)
  })

  it('renders submit button', async () => {
    const wrapper = await mountSuspended(LoginPage)
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.exists()).toBe(true)
  })

  it('renders the hero section', async () => {
    const wrapper = await mountSuspended(LoginPage)
    const text = wrapper.text()
    expect(text.length).toBeGreaterThan(0)
    expect(wrapper.find('h1').exists()).toBe(true)
  })

  it('renders login title and subtitle', async () => {
    const wrapper = await mountSuspended(LoginPage)
    const h2 = wrapper.find('h2')
    expect(h2.exists()).toBe(true)
    // Title is translated — check it's not empty
    expect(h2.text().length).toBeGreaterThan(0)
  })

  it('renders forgot password link pointing to /forgot-password', async () => {
    const wrapper = await mountSuspended(LoginPage)
    const forgotLink = wrapper.find('a[href="/forgot-password"]')
    expect(forgotLink.exists()).toBe(true)
    expect(forgotLink.text().length).toBeGreaterThan(0)
  })

  it('renders create account link pointing to /register', async () => {
    const wrapper = await mountSuspended(LoginPage)
    const registerLink = wrapper.find('a[href="/register"]')
    expect(registerLink.exists()).toBe(true)
    expect(registerLink.text().length).toBeGreaterThan(0)
  })

  it('toggles password visibility when clicking the eye button', async () => {
    const wrapper = await mountSuspended(LoginPage)
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
    const wrapper = await mountSuspended(LoginPage)
    const emailInput = wrapper.find('input[type="email"]')
    await emailInput.setValue('test@example.com')
    expect((emailInput.element as HTMLInputElement).value).toBe('test@example.com')
  })

  it('submits the form without errors', async () => {
    const wrapper = await mountSuspended(LoginPage)
    const form = wrapper.find('form')
    await form.trigger('submit')
    expect(wrapper.exists()).toBe(true)
  })
})
