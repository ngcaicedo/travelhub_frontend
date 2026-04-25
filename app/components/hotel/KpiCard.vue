<script setup lang="ts">
defineProps<{
  icon: string
  label: string
  value: string
  iconColor?: string
}>()
</script>

<template>
  <UCard class="h-full">
    <div class="flex items-start justify-between">
      <div
        class="flex items-center justify-center size-10 rounded-lg"
        :class="iconColor ?? 'bg-travelhub-50 text-travelhub-600'"
      >
        <UIcon :name="icon" class="size-5" />
      </div>
    </div>
    <p class="mt-6 text-sm font-medium text-slate-500">
      {{ label }}
    </p>
    <p class="mt-1 text-2xl font-black text-slate-900">
      {{ value }}
    </p>
  </UCard>
</template>
