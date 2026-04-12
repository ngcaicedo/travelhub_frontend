<script setup lang="ts">
interface Props {
  cancellationPolicy?: 'flexible' | 'moderate' | 'strict'
}

withDefaults(defineProps<Props>(), {
  cancellationPolicy: 'flexible'
})

const { t } = useI18n()

const policiesMap = computed(() => ({
  flexible: {
    label: t('property.policies.flexible.label'),
    color: 'success' as const,
    description: t('property.policies.flexible.description')
  },
  moderate: {
    label: t('property.policies.moderate.label'),
    color: 'warning' as const,
    description: t('property.policies.moderate.description')
  },
  strict: {
    label: t('property.policies.strict.label'),
    color: 'error' as const,
    description: t('property.policies.strict.description')
  }
}))

const refundPolicies = computed(() => [
  {
    title: t('property.policies.freeCancellationTitle'),
    description: t('property.policies.freeCancellationDesc')
  },
  {
    title: t('property.policies.dateChangeTitle'),
    description: t('property.policies.dateChangeDesc')
  },
  {
    title: t('property.policies.securityDepositTitle'),
    description: t('property.policies.securityDepositDesc')
  },
  {
    title: t('property.policies.propertyDamageTitle'),
    description: t('property.policies.propertyDamageDesc')
  }
])
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
