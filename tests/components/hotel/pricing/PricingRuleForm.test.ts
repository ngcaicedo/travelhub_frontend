import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PricingRuleForm from '~/components/hotel/pricing/PricingRuleForm.vue'

describe('PricingRuleForm', () => {
  const baseModel = {
    season_start: '2026-12-01',
    season_end: '2027-01-10',
    price_per_night: 120,
    currency: 'USD',
    tax_rate: 0.19,
    cleaning_fee: 18,
  }

  it('renders core sections', async () => {
    const wrapper = await mountSuspended(PricingRuleForm, {
      props: {
        modelValue: baseModel,
      },
    })

    const text = wrapper.text()
    expect(text).toMatch(/(rule.*basics|bases.*regla|base.*regra)/i)
    expect(text).toMatch(/(real.?time|tiempo.?real|tempo.?real)/i)
  })

  it('disables submit when canEdit is false', async () => {
    const onSubmit = vi.fn()

    const wrapper = await mountSuspended(PricingRuleForm, {
      props: {
        modelValue: baseModel,
        canEdit: false,
        onSubmit,
      },
    })

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()

    await wrapper.find('form').trigger('submit.prevent')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
