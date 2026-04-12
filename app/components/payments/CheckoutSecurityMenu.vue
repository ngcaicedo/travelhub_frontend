<script setup lang="ts">
const { t } = useI18n()

const steps = computed(() => [
  {
    label: t('payments.compliance.steps.checkout'),
    active: true
  },
  {
    label: t('payments.compliance.steps.tokenization'),
    active: false
  },
  {
    label: t('payments.compliance.steps.confirmation'),
    active: false
  }
])
</script>

<template>
  <nav
    aria-label="Payment security progress"
    class="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
  >
    <ol class="flex flex-wrap items-center gap-3 text-sm text-slate-600">
      <li
        v-for="step in steps"
        :key="step.label"
        class="flex items-center gap-3"
      >
        <div
          :class="[
            'inline-flex items-center gap-2 rounded-full px-3 py-2 font-medium',
            step.active ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
          ]"
        >
          <span>{{ step.label }}</span>
        </div>

        <span
          v-if="step !== steps[steps.length - 1]"
          class="text-slate-300"
        >
          /
        </span>
      </li>
    </ol>
  </nav>
</template>
