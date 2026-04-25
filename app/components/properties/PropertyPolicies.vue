<script setup lang="ts">
interface Props {
  cancellationPolicy?: string
}

withDefaults(defineProps<Props>(), {
  cancellationPolicy: ''
})

const { t } = useI18n()
</script>

<template>
  <section class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-900">
      {{ t('property.cancellationPolicy') }}
    </h2>

    <div
      v-if="cancellationPolicy"
      class="bg-gray-50 rounded-lg p-6 flex items-start gap-3"
    >
      <UIcon
        name="i-lucide-shield-check"
        class="w-5 h-5 text-green-600 shrink-0 mt-0.5"
      />
      <p class="text-gray-700 leading-relaxed">
        {{ cancellationPolicy }}
      </p>
    </div>

    <p
      v-else
      class="text-gray-500 text-sm"
    >
      {{ t('property.policies.noPolicy') }}
    </p>
  </section>
</template>
