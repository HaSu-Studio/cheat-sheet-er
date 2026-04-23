<script setup lang="ts">
import type { AddCheatSheetCardProps } from '@/types/components'

defineProps<AddCheatSheetCardProps>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="add-cheat-sheet-card flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 p-3 text-[var(--color-text-secondary)] transition-colors duration-200 hover:border-[var(--color-bg-accent)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] sm:p-4"
    @click="emit('click')"
  >
    <font-awesome-icon icon="plus" class="h-8 w-8 opacity-80" />
    <span class="text-sm font-medium">New cheat sheet</span>
    <span
      v-if="activeCategory"
      class="max-w-full truncate px-2 text-center text-xs opacity-70"
    >in &ldquo;{{ activeCategory }}&rdquo;</span>
  </button>
</template>
