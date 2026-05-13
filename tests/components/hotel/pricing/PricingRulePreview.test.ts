import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PricingRulePreview from '~/components/hotel/pricing/PricingRulePreview.vue'

describe('PricingRulePreview', () => {
  it('renders simulated preview values', async () => {
    const wrapper = await mountSuspended(PricingRulePreview, {
      props: {
        draft: {
          season_start: '2026-12-01',
          season_end: '2027-01-10',
          price_per_night: 200,
          currency: 'USD',
          tax_rate: 0.2,
          cleaning_fee: 10,
        },
      },
    })

    const text = wrapper.text()
    expect(text).toContain('SIMULATED')
    expect(text).toContain('Revenue Uplift')
    expect(text).toContain('Avg. ADR Change')
    expect(text).toContain('Occ. Threshold Hits')
  })
})
