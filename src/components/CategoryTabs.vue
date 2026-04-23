<script setup lang="ts">
import { useCategoryColors } from '@/composables/useCategoryColors'
import type { CategoryTabsProps } from '@/types/components'

defineProps<CategoryTabsProps>()

const emit = defineEmits<{
  'update:activeCategory': [category: string | null]
  'create-category': []
  'delete-category': [category: string]
}>()

const { getCategoryStyles } = useCategoryColors()

const handleDeleteCategory = (event: Event, category: string): void => {
  event.stopPropagation()
  emit('delete-category', category)
}
</script>

<template>
  <div
    class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/80 p-3 sm:p-4"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
      <div class="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        <button
          class="px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200"
          :class="
            activeCategory === null
              ? 'bg-[var(--color-bg-accent)] text-[var(--color-text-primary)] border border-[var(--color-bg-accent)]'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
          "
          @click="emit('update:activeCategory', null)"
        >
          All
          <span class="ml-2 opacity-70">({{ totalCount }})</span>
        </button>

        <button
          v-for="category in categories"
          :key="category"
          class="px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 border category-tab group/tab relative"
          :style="getCategoryStyles(category, activeCategory === category)"
          @click="emit('update:activeCategory', category)"
        >
          <span class="flex items-center gap-2">
            <span>{{ category }}</span>
            <span class="opacity-70">({{ categoryCounts[category] || 0 }})</span>
            <button
              class="ml-1 opacity-0 transition-all duration-200 group-hover/tab:opacity-100 hover:scale-110"
              :title="`Delete ${category}`"
              @click="handleDeleteCategory($event, category)"
            >
              <font-awesome-icon icon="times" class="w-3.5 h-3.5" />
            </button>
          </span>
        </button>
      </div>

      <div class="flex shrink-0 flex-wrap gap-2 sm:flex-nowrap">
        <button
          class="px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 border text-sm bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:border-[var(--color-border-hover)] whitespace-nowrap"
          title="Create new category"
          @click="emit('create-category')"
        >
          <font-awesome-icon icon="tag" class="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for tabs */
div::-webkit-scrollbar {
  height: 6px;
}

.category-tab:hover {
  filter: brightness(1.15);
}

button:hover {
  opacity: 0.9;
}
</style>
