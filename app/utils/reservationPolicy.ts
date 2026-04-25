export type ReservationPolicyRecord = Record<string, unknown>

export interface ReservationPolicyItem {
  key: string
  label: string
  value: string
}

type TranslateFunction = (key: string, ...args: unknown[]) => string

const policyFieldLabels: Record<string, string> = {
  policy_type: 'reservationFlow.policy.policyType'
}

const refundTypeValueMap: Record<string, string> = {
  full: 'full_refund',
  partial: 'partial_refund',
  none: 'no_refund',
  full_refund: 'full_refund',
  partial_refund: 'partial_refund',
  no_refund: 'no_refund'
}

const policyFieldOrder = ['policy_type', 'minimum_notice_hours', 'penalty_percentage', 'timezone']

export const parseReservationPolicy = (policyJson: string | null | undefined): ReservationPolicyRecord | null => {
  if (!policyJson) return null

  try {
    const parsed = JSON.parse(policyJson)

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as ReservationPolicyRecord
    }
  } catch {
    return { raw: policyJson }
  }

  return { raw: policyJson }
}

export const buildReservationPolicyItems = (
  policyJson: string | null | undefined,
  t: TranslateFunction
): ReservationPolicyItem[] => {
  const policy = parseReservationPolicy(policyJson)

  if (!policy) return []

  const keys = policyFieldOrder.filter((key) => key in policy)

  if (!keys.length && typeof policy.raw === 'string') {
    return [{ key: 'raw', label: t('reservationFlow.policy.raw'), value: policy.raw }]
  }

  return keys.map((key) => ({
    key,
    label: t(policyFieldLabels[key] || `reservationFlow.policy.${key}`),
    value: formatReservationPolicyValue(key, policy[key], t)
  }))
}

export const formatReservationRefundType = (
  refundType: string | null | undefined,
  t: TranslateFunction
): string => {
  if (!refundType) return ''

  const normalizedRefundType = refundTypeValueMap[refundType] || refundType
  const translationKey = `reservationFlow.policy.values.${normalizedRefundType}`
  const translated = t(translationKey)

  return translated === translationKey ? refundType : translated
}

const formatReservationPolicyValue = (
  key: string,
  value: unknown,
  t: TranslateFunction
): string => {
  if (value === null || value === undefined || value === '') return ''

  if (key === 'policy_type' && typeof value === 'string') {
    return formatReservationRefundType(value, t)
  }

  if (key === 'minimum_notice_hours') {
    return `${value} ${t('reservationFlow.policy.hoursUnit')}`
  }

  if (key === 'penalty_percentage') {
    return `${value}${t('reservationFlow.policy.percentUnit')}`
  }

  if (Array.isArray(value)) {
    return value.map(String).join(', ')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}