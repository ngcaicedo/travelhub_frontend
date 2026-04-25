<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'
import type { ReservationStatus } from '~/types/hotel'

const props = defineProps<{ status: ReservationStatus }>()

const { t } = useI18n()

type BadgeColor = NonNullable<BadgeProps['color']>

const variantMap: Record<ReservationStatus, { color: BadgeColor, label: string }> = {
  pending_payment: { color: 'warning', label: 'hotel.dashboard.status.pendingPayment' },
  confirmed: { color: 'success', label: 'hotel.dashboard.status.confirmed' },
  cancelled: { color: 'error', label: 'hotel.dashboard.status.cancelled' },
  completed: { color: 'neutral', label: 'hotel.dashboard.status.completed' },
}

const variant = computed(() => variantMap[props.status] ?? variantMap.pending_payment)
</script>

<template>
  <UBadge
    :color="variant.color"
    variant="soft"
    size="sm"
  >
    {{ t(variant.label) }}
  </UBadge>
</template>
