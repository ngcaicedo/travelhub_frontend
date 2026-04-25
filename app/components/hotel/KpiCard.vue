<script setup lang="ts">
defineProps<{
  icon: string
  label: string
  value: string
  iconColor?: string
}>()
</script>

<template>
  <UCard class="h-full" :ui="{ body: 'p-6' }">
    <div
      class="flex size-9 items-center justify-center rounded-lg"
      :class="iconColor ?? 'bg-travelhub-50 text-travelhub-600'"
    >
      <UIcon :name="icon" class="size-5" />
    </div>
    <p class="mt-6 text-sm font-medium text-(--ui-text-muted)">
      {{ label }}
    </p>
    <p class="mt-1 text-2xl font-black tracking-tight text-(--ui-text-highlighted)">
      {{ value }}
    </p>
  </UCard>
</template>
