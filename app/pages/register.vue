<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

const { t } = useI18n()

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: () => `${t('auth.register.title')} - TravelHub`
})

const tabItems = computed<TabsItem[]>(() => [
  { label: t('auth.register.traveler'), value: 'traveler', slot: 'traveler' as const },
  { label: t('auth.register.hotelPartner'), value: 'hotelPartner', slot: 'hotelPartner' as const }
])
</script>

<template>
  <UCard
    class="w-full max-w-[540px]"
    :ui="{
      body: 'p-10 sm:p-10',
      root: 'rounded-xl shadow-sm border border-[#e2e8f0]'
    }"
  >
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
        {{ $t('auth.register.title') }}
      </h1>
      <p class="mt-2 text-base text-slate-600">
        {{ $t('auth.register.subtitle') }}
      </p>
    </div>

    <div class="mb-8">
      <p class="text-sm font-semibold text-slate-900 mb-3">
        {{ $t('auth.register.accountType') }}
      </p>
      <UTabs
        :items="tabItems"
        default-value="traveler"
        variant="pill"
        :ui="{
          list: 'bg-slate-100 rounded-xl p-1',
          trigger: 'rounded-lg font-bold text-sm data-[state=active]:shadow-sm'
        }"
      >
        <template #traveler>
          <RegisterForm type="traveler" />
        </template>

        <template #hotelPartner>
          <RegisterForm type="hotelPartner" />
        </template>
      </UTabs>
    </div>

    <div class="text-center text-base text-slate-600">
      {{ $t('auth.register.hasAccount') }}
      <NuxtLink
        to="/login"
        class="font-bold text-travelhub-600 hover:text-travelhub-700"
      >
        {{ $t('auth.register.login') }}
      </NuxtLink>
    </div>
  </UCard>
</template>
