<script setup lang="ts">
interface Props {
  cancellationPolicy?: 'flexible' | 'moderate' | 'strict'
}

withDefaults(defineProps<Props>(), {
  cancellationPolicy: 'flexible'
})

const { t } = useI18n()

const policiesMap = {
  flexible: {
    label: 'Flexible',
    color: 'success' as const,
    description: 'Cancelación gratuita durante 48 horas. Después, se aplica cargo del 50%.'
  },
  moderate: {
    label: 'Moderada',
    color: 'warning' as const,
    description: 'Cancelación gratuita hasta 7 días antes del check-in. Después, full charge.'
  },
  strict: {
    label: 'Estricta',
    color: 'error' as const,
    description: 'No reembolsable. Se aplica cargo completo.'
  }
} satisfies Record<'flexible' | 'moderate' | 'strict', { label: string; color: 'warning' | 'error'; description: string }>

const refundPolicies = [
  {
    title: 'Cancelación gratuita',
    description: 'Puedes cancelar hasta 48 horas antes del check-in y recibir un reembolso completo.'
  },
  {
    title: 'Modificación de fechas',
    description: 'Puedes cambiar tus fechas de hospedaje sin costo adicional, sujeto a disponibilidad.'
  },
  {
    title: 'Depósito de seguridad',
    description: 'Se requiere un depósito de seguridad equivalente a una noche. Se reembolsará después del check-out.'
  },
  {
    title: 'Daños a la propiedad',
    description: 'El huésped es responsable de cualquier daño causado durante su estadía.'
  }
]
</script>

<template>
  <section class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-900">
      {{ t('property.cancellationPolicy') }}
    </h2>

    <!-- Policy Status -->
    <div class="bg-gray-50 rounded-lg p-6">
      <div class="flex items-center gap-3">
        <UBadge :color="policiesMap[cancellationPolicy].color">
          {{ policiesMap[cancellationPolicy].label }}
        </UBadge>
        <p class="text-gray-700">
          {{ policiesMap[cancellationPolicy].description }}
        </p>
      </div>
    </div>

    <!-- Policy Details -->
    <div class="space-y-4">
      <div
        v-for="(policy, idx) in refundPolicies"
        :key="idx"
        class="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors"
      >
        <h3 class="font-semibold text-gray-900 mb-2">
          {{ policy.title }}
        </h3>
        <p class="text-gray-600 text-sm">
          {{ policy.description }}
        </p>
      </div>
    </div>
  </section>
</template>
