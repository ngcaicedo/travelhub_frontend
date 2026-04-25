<script setup lang="ts">
import type { PropertyImage } from '~/types/api'

interface Props {
  images: readonly PropertyImage[]
  altText?: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const selectedImageIdx = ref(0)

const mainImage = computed(() => props.images[selectedImageIdx.value])
const thumbnailImages = computed(() =>
  props.images
    .map((image, idx) => ({ image, idx }))
    .filter(({ idx }) => idx !== selectedImageIdx.value)
    .slice(0, 4)
)

watch(
  () => props.images,
  (images) => {
    if (!images.length) {
      selectedImageIdx.value = 0
      return
    }

    const coverIdx = images.findIndex(img => img.is_cover)
    selectedImageIdx.value = coverIdx >= 0 ? coverIdx : 0
  },
  { immediate: true }
)
</script>

<template>
  <div class="relative w-full rounded-2xl overflow-hidden bg-gray-100">
    <div class="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-1 h-[320px] sm:h-[400px] lg:h-[460px]">
      <!-- Main Image -->
      <div class="relative overflow-hidden min-h-0">
        <img
          v-if="mainImage"
          :src="mainImage.url_hires ?? mainImage.url"
          :alt="mainImage.alt_text || altText || 'Property'"
          class="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-[1.02]"
          loading="eager"
        >
        <!-- Image counter badge -->
        <UButton
          v-if="props.images.length > 1"
          icon="i-lucide-image"
          variant="soft"
          color="primary"
          size="sm"
          class="absolute bottom-4 right-4 shadow-lg"
        >
          {{ selectedImageIdx + 1 }} / {{ props.images.length }}
        </UButton>
      </div>

      <!-- Thumbnail Grid -->
      <div class="hidden lg:grid grid-cols-2 grid-rows-2 gap-1 min-h-0">
        <div
          v-for="(thumb, i) in thumbnailImages"
          :key="thumb.image.id"
          class="relative overflow-hidden cursor-pointer group min-h-0"
          @click="selectedImageIdx = thumb.idx"
        >
          <img
            :src="thumb.image.url"
            :alt="thumb.image.alt_text || `Room image ${i}`"
            class="w-full h-full object-cover object-center transition-transform duration-300"
            loading="lazy"
          >
          <div
            class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 pointer-events-none"
          />
          <!-- Show all photos overlay on last thumbnail -->
          <div
            v-if="i === thumbnailImages.length - 1 && images.length > 5"
            class="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
          >
            <UButton
              icon="i-lucide-grid-2x2"
              variant="solid"
              color="neutral"
              size="sm"
              class="pointer-events-none bg-white text-slate-900"
            >
              {{ t('property.showAllPhotos') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
