<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { t } = useI18n()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: t('payments.compliance.steps.checkout'),
    icon: 'i-lucide-credit-card',
    active: true
  },
  {
    label: t('payments.compliance.steps.tokenization'),
    icon: 'i-lucide-shield-check'
  },
  {
    label: t('payments.compliance.steps.confirmation'),
    icon: 'i-lucide-badge-check'
  }
])
</script>

<template>
  <UNavigationMenu
    :items="items"
    highlight
    color="primary"
    variant="link"
    class="w-full"
  />
</template>
