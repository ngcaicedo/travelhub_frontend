interface StrengthTier {
  label: string
  bgColor: string
  textColor: string
}

const TIERS: [string, string, string][] = [
  ['', '', ''],
  ['auth.register.strengthWeak', 'bg-error-500', 'text-error-700'],
  ['auth.register.strengthMedium', 'bg-travelhub-500', 'text-travelhub-700'],
  ['auth.register.strengthStrong', 'bg-success-500', 'text-success-700'],
  ['auth.register.strengthVeryStrong', 'bg-success-500', 'text-success-700']
]

export function usePasswordStrength(password: Ref<string>) {
  const { t } = useI18n()

  const score = computed(() => {
    const val = password.value
    let s = 0
    if (val.length >= 8) s++
    if (/[A-Z]/.test(val)) s++
    if (/[0-9]/.test(val)) s++
    if (/[^A-Za-z0-9]/.test(val)) s++
    return s
  })

  const tier = computed<StrengthTier>(() => {
    const [labelKey, bgColor, textColor] = TIERS[score.value]!
    return {
      label: labelKey ? t(labelKey) : '',
      bgColor,
      textColor
    }
  })

  return {
    score,
    label: computed(() => tier.value.label),
    bgColor: computed(() => tier.value.bgColor),
    textColor: computed(() => tier.value.textColor)
  }
}
