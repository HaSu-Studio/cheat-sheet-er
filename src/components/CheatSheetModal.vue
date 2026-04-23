<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useCheatSheetsStore } from '@/stores/cheatSheets'
import { AppButton } from '@/components/shared'
import type { CheatSheetModalProps, CheatSheetFormData } from '@/types/components'

const props = defineProps<CheatSheetModalProps>()
const store = useCheatSheetsStore()
const { categories } = storeToRefs(store)

const emit = defineEmits<{
  close: []
  save: [data: CheatSheetFormData]
}>()

const form = ref<CheatSheetFormData>({
  title: '',
  category: '',
  content: '',
})

const errors = ref<Partial<Record<keyof CheatSheetFormData, string>>>({})

watch(
  () => props.isOpen,
  (isOpen: boolean): void => {
    if (isOpen) {
      errors.value = {}
      form.value = {
        title: '',
        category: props.initialCategory || '',
        content: '',
      }
    }
  },
)

const validateForm = (): boolean => {
  errors.value = {}

  if (!form.value.title.trim()) {
    errors.value.title = 'Title is required'
  } else if (form.value.title.trim().length < 3) {
    errors.value.title = 'Title must be at least 3 characters'
  } else if (form.value.title.trim().length > 100) {
    errors.value.title = 'Title must be less than 100 characters'
  }

  if (!form.value.category.trim()) {
    errors.value.category = 'Category is required'
  }

  if (!form.value.content.trim()) {
    errors.value.content = 'Content is required'
  }

  return Object.keys(errors.value).length === 0
}

const handleSave = (): void => {
  if (!validateForm()) {
    return
  }

  const data: CheatSheetFormData = {
    title: form.value.title.trim(),
    category: form.value.category.trim(),
    content: form.value.content.trim(),
  }

  emit('save', data)
}

const handleClose = (): void => {
  errors.value = {}
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click="handleClose"
      >
        <div
          class="w-full max-w-4xl mx-4 rounded-lg p-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] h-[85vh] flex flex-col"
          @click.stop
        >
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-[var(--color-text-primary)]">
              Create cheat sheet
            </h2>
            <button
              class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
              @click="handleClose"
            >
              <font-awesome-icon icon="times" class="w-6 h-6" />
            </button>
          </div>

          <form @submit.prevent="handleSave" class="space-y-3 flex flex-col flex-1 overflow-hidden">
            <div class="grid grid-cols-2 gap-3 flex-shrink-0">
              <div>
                <label class="block text-xs font-medium mb-1 text-[var(--color-text-primary)]">
                  Title <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.title"
                  type="text"
                  class="w-full rounded px-2 py-1.5 text-sm bg-[var(--color-bg-primary)] border text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors duration-200"
                  :class="errors.title ? 'border-red-500' : 'border-[var(--color-border)]'"
                  placeholder="Title"
                  @input="errors.title = ''"
                />
                <p v-if="errors.title" class="text-red-500 text-xs mt-0.5">{{ errors.title }}</p>
              </div>

              <div>
                <label class="block text-xs font-medium mb-1 text-[var(--color-text-primary)]">
                  Category
                </label>
                <!-- Fixed category when adding to specific category -->
                <div
                  v-if="initialCategory"
                  class="w-full rounded px-2 py-1.5 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] opacity-70"
                >
                  {{ form.category }}
                </div>
                <!-- Category selection when creating from scratch -->
                <select
                  v-else
                  v-model="form.category"
                  class="w-full rounded px-2 py-1.5 text-sm bg-[var(--color-bg-primary)] border text-[var(--color-text-primary)] transition-colors duration-200"
                  :class="errors.category ? 'border-red-500' : 'border-[var(--color-border)]'"
                  @change="errors.category = ''"
                >
                  <option value="" disabled>Select a category</option>
                  <option v-for="category in categories" :key="category" :value="category">
                    {{ category }}
                  </option>
                </select>
                <p v-if="errors.category" class="text-red-500 text-xs mt-0.5">
                  {{ errors.category }}
                </p>
                <p
                  v-if="!initialCategory && categories.length === 0"
                  class="text-[var(--color-text-secondary)] text-xs mt-1"
                >
                  Create a category first using "New Category" button
                </p>
              </div>
            </div>

            <div class="flex-1 flex flex-col min-h-0">
              <label class="block text-xs font-medium mb-1 text-[var(--color-text-primary)]">
                Content <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="form.content"
                class="flex-1 w-full rounded px-3 py-2 bg-[var(--color-bg-primary)] border text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors duration-200 resize-none font-mono text-sm"
                :class="errors.content ? 'border-red-500' : 'border-[var(--color-border)]'"
                placeholder="Enter cheat sheet content..."
                @input="errors.content = ''"
              />
              <p v-if="errors.content" class="text-red-500 text-xs mt-0.5">{{ errors.content }}</p>
            </div>

            <div class="flex justify-end gap-3 pt-4 flex-shrink-0">
              <AppButton
                type="button"
                variant="secondary"
                @click="handleClose"
              >
                Cancel
              </AppButton>
              <AppButton
                type="submit"
                variant="primary"
              >
                Create
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
