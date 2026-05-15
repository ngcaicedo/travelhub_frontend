import type { MaybeRefOrGetter } from 'vue'
import {
  createSeasonalPricing,
  getSeasonalPricing,
  listSeasonalPricing,
  updateSeasonalPricing,
} from '~/services/seasonalPricingService'
import type {
  SeasonalPricingResponse,
  SeasonalPricingValidationErrors,
  SeasonalPricingWritePayload,
} from '~/types/seasonalPricing'
import { validateSeasonalPricingPayload } from '~/utils/seasonalPricingValidation'

function defaultDraft(): SeasonalPricingWritePayload {
  return {
    season_start: '',
    season_end: '',
    price_per_night: 0,
    currency: 'COP',
    tax_rate: 0,
    cleaning_fee: 0,
  }
}

function toMessage(error: unknown): string {
  const apiError = error as { message?: string, statusCode?: number }

  if (apiError.statusCode === 423) {
    return 'errors.locked'
  }

  if (apiError.message) {
    return apiError.message
  }

  return 'errors.unknown'
}

export function useSeasonalPricing(
  propertyId: MaybeRefOrGetter<string | undefined>,
  seasonalPriceId?: MaybeRefOrGetter<string | undefined>,
) {
  const auth = useAuthStore()

  const items = ref<SeasonalPricingResponse[]>([])
  const selectedRule = ref<SeasonalPricingResponse | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const validationErrors = ref<SeasonalPricingValidationErrors>({})
  const formDraft = ref<SeasonalPricingWritePayload>(defaultDraft())

  const canEdit = computed(() => {
    if (!selectedRule.value) {
      return true
    }

    return !selectedRule.value.integrity_locked
  })

  function syncDraftFromRule(rule: SeasonalPricingResponse | null) {
    if (!rule) {
      formDraft.value = defaultDraft()
      return
    }

    formDraft.value = {
      season_start: rule.season_start,
      season_end: rule.season_end,
      price_per_night: rule.price_per_night,
      currency: rule.currency,
      tax_rate: rule.tax_rate,
      cleaning_fee: rule.cleaning_fee,
    }
  }

  async function loadList(currentPropertyId: string) {
    items.value = await listSeasonalPricing(currentPropertyId, auth.token)
  }

  async function loadSelectedRule(currentPropertyId: string, currentRuleId: string) {
    selectedRule.value = await getSeasonalPricing(currentPropertyId, currentRuleId, auth.token)
    syncDraftFromRule(selectedRule.value)
  }

  async function refresh() {
    const currentPropertyId = toValue(propertyId)
    const currentRuleId = toValue(seasonalPriceId)

    if (!currentPropertyId) {
      items.value = []
      selectedRule.value = null
      syncDraftFromRule(null)
      error.value = null
      return
    }

    loading.value = true
    error.value = null
    validationErrors.value = {}

    try {
      await loadList(currentPropertyId)

      if (currentRuleId) {
        await loadSelectedRule(currentPropertyId, currentRuleId)
      } else if (selectedRule.value) {
        const refreshedSelected = items.value.find(item => item.id === selectedRule.value?.id) || null
        selectedRule.value = refreshedSelected
        syncDraftFromRule(refreshedSelected)
      }
    } catch (e: unknown) {
      error.value = toMessage(e)
    } finally {
      loading.value = false
    }
  }

  async function submitCreate(payload?: SeasonalPricingWritePayload): Promise<SeasonalPricingResponse | null> {
    const currentPropertyId = toValue(propertyId)
    if (!currentPropertyId) {
      error.value = 'errors.notFound'
      return null
    }

    const data = payload || formDraft.value
    const validation = validateSeasonalPricingPayload(data)
    validationErrors.value = validation.errors

    if (!validation.isValid) {
      error.value = 'hotel.pricing.validation.generic'
      return null
    }

    saving.value = true
    error.value = null

    try {
      const created = await createSeasonalPricing(currentPropertyId, data, auth.token)
      items.value = [created, ...items.value]
      selectedRule.value = created
      syncDraftFromRule(created)
      return created
    } catch (e: unknown) {
      error.value = toMessage(e)
      return null
    } finally {
      saving.value = false
    }
  }

  async function submitUpdate(payload?: SeasonalPricingWritePayload): Promise<SeasonalPricingResponse | null> {
    const currentPropertyId = toValue(propertyId)
    if (!currentPropertyId || !selectedRule.value) {
      error.value = 'errors.notFound'
      return null
    }

    if (!canEdit.value) {
      error.value = 'errors.locked'
      return null
    }

    const data = payload || formDraft.value
    const validation = validateSeasonalPricingPayload(data)
    validationErrors.value = validation.errors

    if (!validation.isValid) {
      error.value = 'hotel.pricing.validation.generic'
      return null
    }

    saving.value = true
    error.value = null

    try {
      const updated = await updateSeasonalPricing(
        currentPropertyId,
        selectedRule.value.id,
        data,
        auth.token,
      )

      selectedRule.value = updated
      items.value = items.value.map(item => item.id === updated.id ? updated : item)
      syncDraftFromRule(updated)
      return updated
    } catch (e: unknown) {
      error.value = toMessage(e)
      return null
    } finally {
      saving.value = false
    }
  }

  watch(
    [() => toValue(propertyId), () => toValue(seasonalPriceId)],
    async ([nextPropertyId, nextRuleId]) => {
      if (!nextPropertyId) {
        items.value = []
        selectedRule.value = null
        syncDraftFromRule(null)
        return
      }

      await refresh()

      if (!nextRuleId) {
        selectedRule.value = null
      }
    },
    { immediate: true },
  )

  return {
    items: readonly(items),
    selectedRule: readonly(selectedRule),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    validationErrors: readonly(validationErrors),
    formDraft,
    canEdit: readonly(canEdit),
    refresh,
    submitCreate,
    submitUpdate,
  }
}
