import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { usePasswordStrength } from '~/composables/usePasswordStrength'

mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => `T(${key})`
}))

describe('usePasswordStrength', () => {
  it('starts with score 0 and empty label for empty password', () => {
    const password = ref('')
    const { score, label, bgColor, textColor } = usePasswordStrength(password)

    expect(score.value).toBe(0)
    expect(label.value).toBe('')
    expect(bgColor.value).toBe('')
    expect(textColor.value).toBe('')
  })

  it('scores 1 for a long lowercase-only password', () => {
    const password = ref('lowercase')
    const { score, label } = usePasswordStrength(password)

    expect(score.value).toBe(1)
    expect(label.value).toBe('T(auth.register.strengthWeak)')
  })

  it('scores 2 with length + uppercase', () => {
    const password = ref('LongPass')
    const { score, label } = usePasswordStrength(password)

    expect(score.value).toBe(2)
    expect(label.value).toBe('T(auth.register.strengthMedium)')
  })

  it('scores 3 with length + uppercase + number', () => {
    const password = ref('LongPass1')
    const { score, label, bgColor } = usePasswordStrength(password)

    expect(score.value).toBe(3)
    expect(label.value).toBe('T(auth.register.strengthStrong)')
    expect(bgColor.value).toBe('bg-success-500')
  })

  it('scores 4 when all four requirements are met', () => {
    const password = ref('LongPass1!')
    const { score, label, textColor } = usePasswordStrength(password)

    expect(score.value).toBe(4)
    expect(label.value).toBe('T(auth.register.strengthVeryStrong)')
    expect(textColor.value).toBe('text-success-500')
  })

  it('reacts to password changes', () => {
    const password = ref('')
    const { score, label } = usePasswordStrength(password)

    expect(score.value).toBe(0)

    password.value = 'short'
    expect(score.value).toBe(0)

    password.value = 'longenough'
    expect(score.value).toBe(1)

    password.value = 'LongEnough1!'
    expect(score.value).toBe(4)
    expect(label.value).toBe('T(auth.register.strengthVeryStrong)')
  })
})
