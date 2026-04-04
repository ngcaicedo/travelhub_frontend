<script setup lang="ts">
import type { RegisterPayload } from '~/types/api'
import { getApiErrorMessage } from '~/utils/apiError'
import { usersService } from '~/services/users'

const props = defineProps<{
  type: 'traveler' | 'hotelPartner'
}>()

const { t } = useI18n()

interface BaseForm {
  email: string
  phone: string
  password: string
}

interface TravelerForm extends BaseForm {
  fullName: string
}

interface HotelPartnerForm extends BaseForm {
  hotelName: string
  contactName: string
}

type FormType = TravelerForm | HotelPartnerForm

const form = reactive<FormType>(
  props.type === 'traveler'
    ? { fullName: '', email: '', phone: '', password: '' }
    : { hotelName: '', contactName: '', email: '', phone: '', password: '' }
)

const showPassword = ref(false)
const agreeTerms = ref(false)
const error = ref('')
const isLoading = ref(false)
const { score, label, bgColor, textColor } = usePasswordStrength(toRef(() => form.password))

async function onSubmit() {
  if (!agreeTerms.value) {
    error.value = t('auth.register.termsRequired')
    return
  }

  error.value = ''
  isLoading.value = true

  try {
    const base = { email: form.email, phone: form.phone, password: form.password }
    const payload: RegisterPayload
      = props.type === 'traveler'
        ? { ...base, full_name: (form as TravelerForm).fullName, role: 'traveler' }
        : { ...base, full_name: (form as HotelPartnerForm).contactName, hotel_name: (form as HotelPartnerForm).hotelName, role: 'hotel_partner' }

    await usersService.register(payload)
    await navigateTo('/login')
  } catch (e) {
    error.value = getApiErrorMessage(e, t('common.unexpectedError'))
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <UAlert
      v-if="error"
      icon="i-lucide-alert-circle"
      color="error"
      :title="t('auth.register.error')"
      :description="error"
      closable
      class="mb-5"
      @close="error = ''"
    />

    <form
      class="space-y-5 mt-8"
      @submit.prevent="onSubmit"
    >
      <UFormField
        v-if="type === 'traveler'"
        :label="$t('auth.register.fullName')"
      >
        <UInput
          v-model="(form as TravelerForm).fullName"
          :placeholder="$t('auth.register.fullNamePlaceholder')"
          icon="i-lucide-user"
          size="xl"
          class="w-full"
        />
      </UFormField>

      <template v-if="type === 'hotelPartner'">
        <UFormField :label="$t('auth.register.hotelName')">
          <UInput
            v-model="(form as HotelPartnerForm).hotelName"
            :placeholder="$t('auth.register.hotelNamePlaceholder')"
            icon="i-lucide-building-2"
            size="xl"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="$t('auth.register.contactName')">
          <UInput
            v-model="(form as HotelPartnerForm).contactName"
            :placeholder="$t('auth.register.contactNamePlaceholder')"
            icon="i-lucide-user"
            size="xl"
            class="w-full"
          />
        </UFormField>
      </template>

      <UFormField :label="$t('auth.register.email')">
        <UInput
          v-model="form.email"
          type="email"
          :placeholder="$t('auth.register.emailPlaceholder')"
          icon="i-lucide-mail"
          size="xl"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="$t('auth.register.phone')">
        <UInput
          v-model="form.phone"
          type="tel"
          :placeholder="$t('auth.register.phonePlaceholder')"
          icon="i-lucide-phone"
          size="xl"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="$t('auth.register.password')">
        <UInput
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          :placeholder="$t('auth.register.passwordPlaceholder')"
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

        <div
          v-if="form.password.length > 0"
          class="mt-2"
        >
          <div class="flex gap-1 h-1.5">
            <div
              v-for="i in 4"
              :key="i"
              class="flex-1 rounded-full transition-colors"
              :class="i <= score ? bgColor : 'bg-slate-200'"
            />
          </div>
          <div class="flex items-center justify-between mt-1.5">
            <span
              class="text-xs font-medium uppercase"
              :class="textColor"
            >{{ label }}</span>
            <span class="text-xs text-slate-400">{{ $t('auth.register.passwordHint') }}</span>
          </div>
        </div>
      </UFormField>

      <div class="pt-2">
        <UCheckbox v-model="agreeTerms">
          <template #label>
            <span class="text-sm text-slate-500">
              {{ $t('auth.register.termsAgree') }}
              <NuxtLink
                to="#"
                class="font-medium text-travelhub-600 hover:text-travelhub-700"
              >{{ $t('auth.register.termsOfService') }}</NuxtLink>
              {{ $t('auth.register.and') }}
              <NuxtLink
                to="#"
                class="font-medium text-travelhub-600 hover:text-travelhub-700"
              >{{ $t('auth.register.privacyPolicy') }}</NuxtLink>.
            </span>
          </template>
        </UCheckbox>
      </div>

      <div class="pt-4">
        <UButton
          type="submit"
          :label="$t('auth.register.submit')"
          size="xl"
          block
          :loading="isLoading"
        />
      </div>
    </form>
  </div>
</template>
