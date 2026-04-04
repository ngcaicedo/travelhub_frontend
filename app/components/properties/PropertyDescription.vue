<script setup lang="ts">
interface Props {
  description: string
  maxLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxLength: 300
})

const { t } = useI18n()
const isExpanded = ref(false)

const displayText = computed(() => {
  if (isExpanded.value) {
    return props.description
  }
  return props.description.substring(0, props.maxLength || 300) + (props.description.length > (props.maxLength || 300) ? '...' : '')
})

const shouldShowReadMore = computed(() => props.description.length > (props.maxLength || 300))
</script>

<template>
  <section class="space-y-4">
    <h2 class="text-2xl font-bold text-gray-900">
      {{ t('property.aboutSpace') }}
    </h2>

    <p class="text-gray-700 leading-relaxed">
      {{ displayText }}
    </p>

    <button
      v-if="shouldShowReadMore"
      class="text-primary font-semibold hover:underline"
      @click="isExpanded = !isExpanded"
    >
      {{ isExpanded ? t('common.readLess') : t('common.readMore') }}
    </button>
  </section>
</template>
