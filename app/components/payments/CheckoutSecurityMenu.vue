<script setup lang="ts">
const { t } = useI18n()

const steps = computed(() => [
  {
    value: 'checkout',
    label: t('payments.compliance.steps.checkout'),
    active: true
  },
  {
    value: 'tokenization',
    label: t('payments.compliance.steps.tokenization'),
    active: false
  },
  {
    value: 'confirmation',
    label: t('payments.compliance.steps.confirmation'),
    active: false
  }
])
</script>

<template>
  <nav
    aria-label="Payment security progress"
    class="mb-6"
  >
    <UNavigationMenu
      :items="steps"
      orientation="horizontal"
      highlight
      highlight-color="primary"
      color="primary"
      variant="pill"
      :ui="{
        root: 'rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm',
        list: 'flex flex-wrap items-center gap-3',
        item: 'relative',
        link: 'rounded-full px-3 py-2 text-sm font-medium',
        viewportWrapper: 'hidden',
        indicator: 'hidden'
      }"
    >
      <template #item="{ item }">
        <span :aria-current="item.active ? 'step' : undefined">
          {{ item.label }}
        </span>
      </template>
    </UNavigationMenu>
  </nav>
</template>
