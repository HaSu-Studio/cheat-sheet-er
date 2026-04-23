<script setup lang="ts">
import type { SearchBarProps } from '@/types/components'

defineProps<SearchBarProps>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const handleInput = (event: Event): void => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="w-full">
    <div class="relative w-full">
      <input
        :value="modelValue"
        type="text"
        placeholder="Search cheat sheets..."
        class="w-full rounded-lg px-4 py-3 pl-10 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-border-hover)] transition-colors duration-200"
        @input="handleInput"
      />
      <font-awesome-icon
        icon="search"
        class="absolute left-3 top-3.5 w-4 h-4 text-[var(--color-text-secondary)]"
      />
    </div>
  </div>
</template>
