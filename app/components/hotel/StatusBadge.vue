<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'
import type { ReservationStatus } from '~/types/hotel'

const props = defineProps<{ status: ReservationStatus }>()

const { t } = useI18n()

type BadgeColor = NonNullable<BadgeProps['color']>

const variantMap: Record<ReservationStatus, { color: BadgeColor, label: string }> = {
  pending_payment: { color: 'warning', label: 'hotelReservations.status.pending_payment' },
  confirmed: { color: 'success', label: 'hotelReservations.status.confirmed' },
  cancelled: { color: 'error', label: 'hotelReservations.status.cancelled' },
  completed: { color: 'neutral', label: 'hotelReservations.status.completed' },
  modification_pending_payment: { color: 'warning', label: 'hotelReservations.status.modification_pending_payment' },
  modification_confirmed: { color: 'info', label: 'hotelReservations.status.modification_confirmed' },
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
