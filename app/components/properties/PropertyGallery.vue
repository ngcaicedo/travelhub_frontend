<script setup lang="ts">
import type { PropertyImage } from '~/types/api'

interface Props {
  images: readonly PropertyImage[]
  altText?: string
}

const props = defineProps<Props>()
const selectedImageIdx = ref(0)

const mainImage = computed(() => props.images[selectedImageIdx.value])
const thumbnailImages = computed(() => props.images.slice(1, 5))
</script>

<template>
  <div class="grid grid-cols-4 gap-2 w-full h-full rounded-xl overflow-hidden bg-gray-100">
    <!-- Main Image -->
    <div class="col-span-4 lg:col-span-2 h-96 lg:h-full relative overflow-hidden">
      <img
        v-if="mainImage"
        :src="mainImage.url"
        :alt="mainImage.alt_text || altText || 'Property'"
        class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
      >
      <UButton
        v-if="props.images.length > 1"
        icon="i-lucide-image"
        variant="soft"
        color="primary"
        class="absolute bottom-4 right-4 shadow-lg"
      >
        {{ selectedImageIdx + 1 }} / {{ props.images.length }}
      </UButton>
    </div>

    <!-- Thumbnail Navigation -->
    <div class="col-span-4 lg:col-span-2 grid grid-cols-2 lg:grid-cols-2 gap-2">
      <div
        v-for="(image, idx) in thumbnailImages"
        :key="image.id"
        class="relative h-20 lg:h-24 rounded-lg overflow-hidden cursor-pointer group"
        @click="selectedImageIdx = idx + 1"
      >
        <img
          :src="image.url"
          :alt="image.alt_text || `Room image ${idx}`"
          class="w-full h-full object-cover transition-transform duration-300"
          :class="{ 'ring-2 ring-primary': selectedImageIdx === idx + 1 }"
        >
        <div
          class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200"
        />
      </div>

      <!-- Show all photos button -->
      <div
        v-if="images.length > 5"
        class="relative h-20 lg:h-24 rounded-lg overflow-hidden cursor-pointer group bg-gray-200 flex items-center justify-center"
      >
        <div class="text-center">
          <UIcon
            name="i-lucide-images"
            class="w-6 h-6 mx-auto mb-2"
          />
          <span class="text-xs font-semibold">{{ images.length - 5 }} more</span>
        </div>
      </div>
    </div>
  </div>
</template>
