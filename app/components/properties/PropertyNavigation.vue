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
        <button
          v-for="section in props.sections"
          :key="section.id"
          class="flex items-center gap-2 px-4 py-4 text-sm font-medium text-gray-700 hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary whitespace-nowrap"
          :class="{
            'text-primary border-primary': props.activeSection === section.id
          }"
          @click="navigate(section.id)"
        >
          <UIcon :name="section.icon" class="w-4 h-4" />
          {{ section.label }}
        </button>
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
