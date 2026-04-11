<script setup lang="ts">
const { locale, locales, setLocale, t } = useI18n()

const localeOptions = computed(() =>
  (locales.value as Array<{ code: string, name: string }>).map(item => ({
    label: item.name,
    value: item.code
  }))
)

function onLocaleChange(code: string) {
  setLocale(code as 'es' | 'en' | 'pt')
}
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc]">
    <UHeader class="border-b border-slate-200 bg-white/90 backdrop-blur">
      <template #left>
        <div class="flex items-center gap-6">
          <NuxtLink to="/">
            <AppLogo class="h-6 w-auto shrink-0" />
          </NuxtLink>

          <nav class="hidden items-center gap-2 md:flex">
            <UButton
              to="/login"
              :label="t('navigation.login')"
              color="neutral"
              variant="ghost"
            />
            <UButton
              to="/checkout"
              :label="t('navigation.checkout')"
              color="primary"
              variant="subtle"
            />
          </nav>
        </div>
      </template>

      <template #right>
        <div class="flex items-center">
          <USelect
            :model-value="locale"
            :items="localeOptions"
            icon="i-lucide-globe"
            color="neutral"
            variant="ghost"
            size="sm"
            class="w-[138px]"
            @update:model-value="onLocaleChange"
          />
        </div>
      </template>
    </UHeader>

    <UMain class="pb-10">
      <slot />
    </UMain>
  </div>
</template>
