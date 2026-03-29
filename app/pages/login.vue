<script setup lang="ts">
const { t } = useI18n()

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: () => `${t('auth.login.title')} - TravelHub`
})

const form = reactive({
  email: '',
  password: ''
})

const showPassword = ref(false)

function onSubmit() {
  // TODO: Integrar con API de autenticación (MPF-1)
}
</script>

<template>
  <div class="w-full max-w-[1024px] bg-white rounded-xl shadow-xl overflow-hidden flex min-h-[588px]">
    <!-- Left Side: Hero/Visual -->
    <div class="hidden lg:flex flex-1 flex-col justify-between bg-travelhub-600 relative overflow-hidden p-12">
      <div class="absolute inset-0 bg-gradient-to-br from-travelhub-600 via-travelhub-600/80 to-transparent z-10" />

      <div class="relative z-20 space-y-8">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-plane"
            class="text-white size-5"
          />
          <span class="text-sm font-bold text-white uppercase tracking-widest">{{ $t('common.premiumTravel') }}</span>
        </div>

        <h1 class="text-4xl font-bold text-white leading-tight">
          {{ $t('auth.hero.title') }}
        </h1>

        <p class="text-lg text-white/80 max-w-sm">
          {{ $t('auth.hero.description') }}
        </p>
      </div>

      <div class="relative z-20" />
    </div>

    <!-- Right Side: Login Form -->
    <div class="flex-1 flex flex-col justify-center p-10 lg:p-16">
      <div class="mb-10">
        <h2 class="text-3xl font-bold text-slate-900">
          {{ $t('auth.login.title') }}
        </h2>
        <p class="mt-2 text-base text-slate-500">
          {{ $t('auth.login.subtitle') }}
        </p>
      </div>

      <form
        class="space-y-6"
        @submit.prevent="onSubmit"
      >
        <UFormField :label="$t('auth.login.email')">
          <UInput
            v-model="form.email"
            type="email"
            :placeholder="$t('auth.login.emailPlaceholder')"
            icon="i-lucide-mail"
            size="xl"
            class="w-full"
          />
        </UFormField>

        <UFormField>
          <template #label>
            <span>{{ $t('auth.login.password') }}</span>
          </template>
          <template #hint>
            <NuxtLink
              to="/forgot-password"
              class="text-sm font-semibold text-travelhub-600 hover:text-travelhub-700"
            >
              {{ $t('auth.login.forgotPassword') }}
            </NuxtLink>
          </template>
          <UInput
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="$t('auth.login.passwordPlaceholder')"
            icon="i-lucide-lock"
            size="xl"
            class="w-full"
            :ui="{ trailing: 'pointer-events-auto' }"
          >
            <template #trailing>
              <UButton
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                color="neutral"
                variant="ghost"
                size="xs"
                :padded="false"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UButton
          type="submit"
          :label="$t('auth.login.submit')"
          trailing-icon="i-lucide-arrow-right"
          size="xl"
          block
        />
      </form>

      <div class="mt-10 text-center text-base text-slate-600">
        {{ $t('auth.login.noAccount') }}
        <NuxtLink
          to="/register"
          class="font-bold text-travelhub-600 hover:text-travelhub-700"
        >
          {{ $t('auth.login.createAccount') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
