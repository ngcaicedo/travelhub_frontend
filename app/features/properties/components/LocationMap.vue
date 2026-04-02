<script setup lang="ts">
interface Props {
  latitude: number
  longitude: number
  location: string
}

const props = defineProps<Props>()

const { t } = useI18n()

const openExternalMap = () => {
  if (process.client) {
    const query = encodeURIComponent(`${props.latitude},${props.longitude}`)
    window.open(`https://www.google.com/maps?q=${query}`, '_blank', 'noopener,noreferrer')
  }
}
</script>

<template>
  <section class="space-y-4">
    <h2 class="text-2xl font-bold text-gray-900">
      {{ t('property.whereYouBe') }}
    </h2>

    <div class="rounded-xl overflow-hidden h-96 bg-slate-100 border border-slate-200 relative flex items-center justify-center">
      <div class="text-center space-y-3 px-6">
        <UIcon name="i-lucide-map-pinned" class="w-10 h-10 mx-auto text-slate-600" />
        <p class="text-slate-700 font-medium">{{ props.location }}</p>
        <p class="text-sm text-slate-500">{{ props.latitude }}, {{ props.longitude }}</p>
        <UButton icon="i-lucide-external-link" color="primary" variant="soft" @click="openExternalMap">
          Open in Google Maps
        </UButton>
      </div>
    </div>

    <p class="text-gray-600 font-medium">
      {{ props.location }}
    </p>
  </section>
</template>
