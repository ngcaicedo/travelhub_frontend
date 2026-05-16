import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import RegisterForm from '~/components/register/Form.vue'

const mockRegister = vi.fn()

vi.mock('~/services/users', () => ({
  usersService: {
    register: (...args: unknown[]) => mockRegister(...args)
  }
}))

describe('RegisterForm', () => {
  beforeEach(() => {
    mockRegister.mockReset()
  })

  describe('traveler type', () => {
    it('renders fullName field for traveler type', async () => {
      const wrapper = await mountSuspended(RegisterForm, { props: { type: 'traveler' } })
      expect(wrapper.find('[data-cy="register-fullname"]').exists()).toBe(true)
    })

    it('does not render hotel fields for traveler type', async () => {
      const wrapper = await mountSuspended(RegisterForm, { props: { type: 'traveler' } })
      expect(wrapper.find('[data-cy="register-hotel-name"]').exists()).toBe(false)
      expect(wrapper.find('[data-cy="register-contact-name"]').exists()).toBe(false)
    })

    it('renders common fields: email, phone, country, password', async () => {
      const wrapper = await mountSuspended(RegisterForm, { props: { type: 'traveler' } })
      expect(wrapper.find('[data-cy="register-email"]').exists()).toBe(true)
      expect(wrapper.find('[data-cy="register-phone"]').exists()).toBe(true)
      expect(wrapper.find('[data-cy="register-country"]').exists()).toBe(true)
      expect(wrapper.find('[data-cy="register-password"]').exists()).toBe(true)
    })

    it('renders terms checkbox and submit button', async () => {
      const wrapper = await mountSuspended(RegisterForm, { props: { type: 'traveler' } })
      expect(wrapper.find('[data-cy="register-terms"]').exists()).toBe(true)
      expect(wrapper.find('[data-cy="register-submit"]').exists()).toBe(true)
    })

    it('shows error when submitting without agreeing to terms', async () => {
      const wrapper = await mountSuspended(RegisterForm, { props: { type: 'traveler' } })

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('calls register service when agreeTerms is true', async () => {
      mockRegister.mockResolvedValue({ id: 'user-1' })

      const wrapper = await mountSuspended(RegisterForm, { props: { type: 'traveler' } })

      // Set form state directly via VM
      const vm = wrapper.vm as unknown as {
        form: { fullName: string, email: string, phone: string, countryCode: string, password: string }
        agreeTerms: boolean
      }
      vm.form.fullName = 'John Doe'
      vm.form.email = 'john@example.com'
      vm.form.phone = '+1234567890'
      vm.form.countryCode = 'US'
      vm.form.password = 'StrongPass123!'
      vm.agreeTerms = true

      await wrapper.vm.$nextTick()
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'john@example.com',
          full_name: 'John Doe',
          country_code: 'US',
          role: 'traveler'
        })
      )
    })

    it('shows error alert when register service fails', async () => {
      mockRegister.mockRejectedValue({ data: { detail: 'Email already exists' } })

      const wrapper = await mountSuspended(RegisterForm, { props: { type: 'traveler' } })

      const vm = wrapper.vm as unknown as { agreeTerms: boolean }
      vm.agreeTerms = true

      await wrapper.vm.$nextTick()
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    })

    it('toggles password visibility', async () => {
      const wrapper = await mountSuspended(RegisterForm, { props: { type: 'traveler' } })

      const passwordInput = wrapper.find('input[type="password"]')
      expect(passwordInput.exists()).toBe(true)

      const toggleButton = wrapper.find('.pointer-events-auto button')
      if (toggleButton.exists()) {
        await toggleButton.trigger('click')
        const visibleInput = wrapper.find('input[type="text"]')
        expect(visibleInput.exists()).toBe(true)
      }
    })

    it('shows password strength when typing', async () => {
      const wrapper = await mountSuspended(RegisterForm, { props: { type: 'traveler' } })

      const passwordInput = wrapper.find('input[type="password"]')
      await passwordInput.setValue('Test1234!')
      await wrapper.vm.$nextTick()

      const text = wrapper.text()
      const hasStrength = text.includes('Weak') || text.includes('Medium') || text.includes('Strong') || text.includes('Very Strong')
        || text.includes('Débil') || text.includes('Media') || text.includes('Fuerte')
      expect(hasStrength).toBe(true)
    })
  })

  describe('hotelPartner type', () => {
    it('renders hotel name and contact name fields', async () => {
      const wrapper = await mountSuspended(RegisterForm, { props: { type: 'hotelPartner' } })
      expect(wrapper.find('[data-cy="register-hotel-name"]').exists()).toBe(true)
      expect(wrapper.find('[data-cy="register-contact-name"]').exists()).toBe(true)
    })

    it('does not render fullName field for hotel partner', async () => {
      const wrapper = await mountSuspended(RegisterForm, { props: { type: 'hotelPartner' } })
      expect(wrapper.find('[data-cy="register-fullname"]').exists()).toBe(false)
    })

    it('calls register with hotel role', async () => {
      mockRegister.mockResolvedValue({ id: 'user-1' })

      const wrapper = await mountSuspended(RegisterForm, { props: { type: 'hotelPartner' } })

      const vm = wrapper.vm as unknown as {
        form: { hotelName: string, contactName: string, email: string, phone: string, countryCode: string, password: string }
        agreeTerms: boolean
      }
      vm.form.hotelName = 'My Hotel'
      vm.form.contactName = 'Jane Smith'
      vm.form.email = 'jane@hotel.com'
      vm.form.phone = '+1234567890'
      vm.form.countryCode = 'BR'
      vm.form.password = 'StrongPass123!'
      vm.agreeTerms = true

      await wrapper.vm.$nextTick()
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'hotel',
          hotel_name: 'My Hotel',
          full_name: 'Jane Smith',
          country_code: 'BR'
        })
      )
    })
  })
})
