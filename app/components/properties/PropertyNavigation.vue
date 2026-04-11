<script setup lang="ts">
interface Section {
  id: string
  label: string
  icon: string
}

interface Props {
  sections: Section[]
  activeSection?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  navigate: [sectionId: string]
}>()

const navigate = (sectionId: string) => {
  emit('navigate', sectionId)
}
</script>

<template>
  <div class="sticky top-16 z-40 bg-white border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-safe">
      <div class="flex overflow-x-auto gap-1 scrollbar-hide">
        <UButton
          v-for="section in props.sections"
          :key="section.id"
          :leading-icon="section.icon"
          :label="section.label"
          variant="ghost"
          color="neutral"
          class="rounded-none px-4 py-4 border-b-2 whitespace-nowrap transition-colors"
          :class="[
            props.activeSection === section.id
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-700 hover:text-primary hover:border-primary'
          ]"
          @click="navigate(section.id)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Para ocultar scrollbar pero mantener funcionalidad */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
