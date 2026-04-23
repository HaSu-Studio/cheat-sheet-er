<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import CodeHighlight from './CodeHighlight.vue'
import { useCheatSheetsStore } from '@/stores/cheatSheets'
import { useCategoryColors } from '@/composables/useCategoryColors'
import type {
  CheatSheetCardLayout,
  CheatSheetCardProps,
  CheatSheetCardResizeEvent,
  CheatSheetFormData,
} from '@/types/components'

interface ResizeDragSession {
  startX: number
  startY: number
  startWidth: number
  startHeight: number
}

const toast = useToast()
const { getCategoryStyles, getCategoryColor } = useCategoryColors()

const props = defineProps<CheatSheetCardProps>()

const emit = defineEmits<{
  delete: [id: string]
  resize: [event: CheatSheetCardResizeEvent]
}>()

const store = useCheatSheetsStore()
const { categories } = storeToRefs(store)

const isEditing = ref(false)
const contentInputRef = ref<HTMLTextAreaElement>()
const menuOpen = ref(false)
const menuRootRef = ref<HTMLElement | null>(null)
const isResizing = ref(false)
const resizeSession = ref<ResizeDragSession | null>(null)
const hasResizeChanged = ref(false)
const localLayout = ref<CheatSheetCardLayout>({ ...props.layout })

const editForm = ref<CheatSheetFormData>({
  title: '',
  category: '',
  content: '',
})

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

const spanToPixels = (span: number, unit: number, gap: number): number => {
  if (span <= 0) return unit
  return span * unit + (span - 1) * gap
}

const pixelsToSpan = (
  px: number,
  unit: number,
  gap: number,
  min: number,
  max: number,
): number => {
  const denominator = unit + gap
  if (denominator <= 0) return min
  const raw = Math.round((px + gap) / denominator)
  return clamp(raw, min, max)
}

const maxAllowedColSpan = computed(() => {
  return Math.max(
    props.resizeConfig.minColSpan,
    Math.min(props.resizeConfig.maxColSpan, props.resizeConfig.columnCount),
  )
})

const applyIncomingLayout = (): void => {
  localLayout.value = {
    colSpan: clamp(props.layout.colSpan, props.resizeConfig.minColSpan, maxAllowedColSpan.value),
    rowSpan: clamp(props.layout.rowSpan, props.resizeConfig.minRowSpan, props.resizeConfig.maxRowSpan),
  }
}

watch(
  () => [props.layout.colSpan, props.layout.rowSpan, props.resizeConfig.columnCount],
  () => {
    if (!isResizing.value) {
      applyIncomingLayout()
    }
  },
  { immediate: true },
)

const categorySelectOptions = computed(() => {
  const list = [...categories.value]
  const current = props.cheatSheet.category?.trim()
  if (current && !list.includes(current)) {
    list.push(current)
  }
  return list.sort((a, b) => a.localeCompare(b))
})

const startEdit = (): void => {
  menuOpen.value = false
  editForm.value = {
    title: props.cheatSheet.title,
    category: props.cheatSheet.category,
    content: props.cheatSheet.content,
  }
  isEditing.value = true
  void nextTick(() => contentInputRef.value?.focus())
}

const cancelEdit = (): void => {
  isEditing.value = false
}

const saveEdit = (): void => {
  if (!editForm.value.title.trim() || !editForm.value.content.trim()) {
    toast.warning('Title and content are required')
    return
  }

  if (!editForm.value.category.trim()) {
    toast.warning('Choose a category')
    return
  }

  store.updateCheatSheet(props.cheatSheet.id, {
    title: editForm.value.title.trim(),
    category: editForm.value.category.trim(),
    content: editForm.value.content.trim(),
  })

  isEditing.value = false
  toast.success('Cheat sheet updated!')
}

const onContentKeydown = (e: KeyboardEvent): void => {
  if (e.key === 'Escape') {
    e.preventDefault()
    cancelEdit()
    return
  }
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    saveEdit()
  }
}

const copyContent = async (): Promise<void> => {
  menuOpen.value = false
  try {
    await navigator.clipboard.writeText(props.cheatSheet.content)
    toast.success('Content copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy:', err)
    toast.error('Failed to copy content')
  }
}

const onMenuEdit = (): void => {
  menuOpen.value = false
  startEdit()
}

const onMenuDelete = (): void => {
  menuOpen.value = false
  emit('delete', props.cheatSheet.id)
}

const formatDate = (isoDate: string): string => {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const effectiveCategory = computed(() => {
  const raw = isEditing.value ? editForm.value.category : props.cheatSheet.category
  return raw?.trim() ?? ''
})

const cardColors = computed(() => {
  if (!effectiveCategory.value) return null
  return getCategoryColor(effectiveCategory.value)
})

const cardStyle = computed<Record<string, string>>(() => {
  const colSpan = clamp(localLayout.value.colSpan, props.resizeConfig.minColSpan, maxAllowedColSpan.value)
  const rowSpan = clamp(
    localLayout.value.rowSpan,
    props.resizeConfig.minRowSpan,
    props.resizeConfig.maxRowSpan,
  )

  const style: Record<string, string> = {
    gridColumn: `span ${colSpan} / span ${colSpan}`,
    gridRow: `span ${rowSpan} / span ${rowSpan}`,
  }

  if (cardColors.value) {
    style.borderColor = cardColors.value.border
  }

  return style
})

const titleStyle = computed(() => {
  if (!cardColors.value) return {}
  return { color: cardColors.value.text }
})

const onCodeAreaDblClick = (e: MouseEvent): void => {
  e.preventDefault()
  if (!isEditing.value) {
    startEdit()
  }
}

const onDocumentClick = (e: MouseEvent): void => {
  if (!menuOpen.value) return
  const el = menuRootRef.value
  if (el && !el.contains(e.target as Node)) {
    menuOpen.value = false
  }
}

const startResize = (e: PointerEvent): void => {
  if (isEditing.value) return

  const colSpan = clamp(localLayout.value.colSpan, props.resizeConfig.minColSpan, maxAllowedColSpan.value)
  const rowSpan = clamp(
    localLayout.value.rowSpan,
    props.resizeConfig.minRowSpan,
    props.resizeConfig.maxRowSpan,
  )

  localLayout.value = {
    colSpan,
    rowSpan,
  }

  resizeSession.value = {
    startX: e.clientX,
    startY: e.clientY,
    startWidth: spanToPixels(colSpan, props.resizeConfig.columnWidth, props.resizeConfig.gap),
    startHeight: spanToPixels(rowSpan, props.resizeConfig.rowHeight, props.resizeConfig.gap),
  }
  hasResizeChanged.value = false
  isResizing.value = true
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', onResizeMove)
  window.addEventListener('pointerup', stopResize)
}

const onResizeMove = (e: PointerEvent): void => {
  if (!isResizing.value || !resizeSession.value) return

  const width = resizeSession.value.startWidth + (e.clientX - resizeSession.value.startX)
  const height = resizeSession.value.startHeight + (e.clientY - resizeSession.value.startY)

  const nextColSpan = pixelsToSpan(
    width,
    props.resizeConfig.columnWidth,
    props.resizeConfig.gap,
    props.resizeConfig.minColSpan,
    maxAllowedColSpan.value,
  )

  const nextRowSpan = pixelsToSpan(
    height,
    props.resizeConfig.rowHeight,
    props.resizeConfig.gap,
    props.resizeConfig.minRowSpan,
    props.resizeConfig.maxRowSpan,
  )

  if (
    nextColSpan !== localLayout.value.colSpan ||
    nextRowSpan !== localLayout.value.rowSpan
  ) {
    localLayout.value = {
      colSpan: nextColSpan,
      rowSpan: nextRowSpan,
    }
    hasResizeChanged.value = true
  }
}

const stopResize = (): void => {
  if (!isResizing.value) return

  isResizing.value = false
  resizeSession.value = null
  document.body.style.userSelect = ''
  window.removeEventListener('pointermove', onResizeMove)
  window.removeEventListener('pointerup', stopResize)

  if (hasResizeChanged.value) {
    emit('resize', {
      id: props.cheatSheet.id,
      layout: { ...localLayout.value },
    })
    hasResizeChanged.value = false
  }
}

const onResizeHandlePointerDown = (e: PointerEvent): void => {
  e.preventDefault()
  e.stopPropagation()
  startResize(e)
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  stopResize()
})
</script>

<template>
  <div
    :class="[
      'cheat-sheet-card relative group flex h-full w-full min-h-0 flex-col overflow-hidden rounded-lg border bg-[var(--color-bg-secondary)] p-3 transition-colors duration-200 sm:p-4',
      isEditing ? 'border-[var(--color-bg-accent)] ring-1 ring-[var(--color-bg-accent)]/30' : '',
      menuOpen ? 'z-40' : 'z-0',
      isResizing ? 'cursor-se-resize select-none' : '',
    ]"
    :style="cardStyle"
  >
    <div
      class="cheat-sheet-card__meta flex min-h-0 shrink-0 items-center gap-2 border-b border-[var(--color-border)]/50 pb-2"
    >
      <input
        v-if="isEditing"
        v-model="editForm.title"
        type="text"
        placeholder="Title"
        class="cheat-sheet-card__title-input min-w-0 flex-1 border-0 border-b border-dashed border-[var(--color-border)] bg-transparent py-0.5 text-sm font-medium leading-none text-[var(--color-text-primary)] outline-none ring-0 placeholder:text-[var(--color-text-primary)]/40 focus:border-[var(--color-bg-accent)] sm:text-base"
        :style="titleStyle"
      />
      <h3
        v-else
        class="min-w-0 flex-1 cursor-text select-text truncate text-sm font-medium leading-none text-[var(--color-text-primary)] transition-colors duration-200 sm:text-base"
        :style="titleStyle"
        title="Double-click to edit"
        @dblclick="startEdit"
      >
        {{ cheatSheet.title }}
      </h3>

      <span
        class="shrink-0 whitespace-nowrap text-[0.65rem] tabular-nums leading-none text-[var(--color-text-primary)] opacity-70 sm:text-xs"
      >{{ formatDate(cheatSheet.updatedAt) }}</span>

      <select
        v-if="isEditing"
        v-model="editForm.category"
        class="category-select category-tag max-w-[32%] min-w-[5.5rem] shrink-0 cursor-pointer truncate rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] py-0.5 pl-1 pr-5 text-left text-[0.65rem] font-medium text-[var(--color-text-primary)] outline-none ring-0 focus:border-[var(--color-bg-accent)] sm:text-xs"
        :style="effectiveCategory ? getCategoryStyles(effectiveCategory) : {}"
        :disabled="categorySelectOptions.length === 0"
      >
        <option value="" disabled>{{ categorySelectOptions.length ? 'Category' : 'No categories' }}</option>
        <option
          v-for="opt in categorySelectOptions"
          :key="opt"
          :value="opt"
        >
          {{ opt }}
        </option>
      </select>
      <span
        v-else-if="cheatSheet.category"
        class="category-tag max-w-[32%] min-w-0 shrink-0 truncate rounded border px-1.5 py-0.5 text-[0.65rem] font-medium leading-none transition-all duration-200 sm:text-xs"
        :style="getCategoryStyles(cheatSheet.category)"
      >
        {{ cheatSheet.category }}
      </span>

      <div
        v-if="!isEditing"
        ref="menuRootRef"
        class="relative z-[1] ml-auto shrink-0"
      >
        <button
          type="button"
          class="rounded p-1.5 text-[var(--color-text-primary)] opacity-100 transition-opacity duration-200 hover:bg-[var(--color-bg-primary)] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
          aria-label="Open menu"
          :aria-expanded="menuOpen"
          @click.stop="menuOpen = !menuOpen"
        >
          <font-awesome-icon icon="ellipsis-vertical" class="h-4 w-4" />
        </button>
        <div
          v-show="menuOpen"
          class="absolute right-0 top-full z-50 mt-1 min-w-[10.5rem] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] py-1 shadow-xl"
          role="menu"
          @click.stop
        >
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-primary)] transition-colors duration-200 hover:bg-[var(--color-bg-secondary)]"
            role="menuitem"
            @click="copyContent"
          >
            <font-awesome-icon icon="copy" class="h-3.5 w-3.5 opacity-80" />
            Copy
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-primary)] transition-colors duration-200 hover:bg-[var(--color-bg-secondary)]"
            role="menuitem"
            @click="onMenuEdit"
          >
            <font-awesome-icon icon="pen" class="h-3.5 w-3.5 opacity-80" />
            Edit
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 transition-colors duration-200 hover:bg-[var(--color-bg-secondary)]"
            role="menuitem"
            @click="onMenuDelete"
          >
            <font-awesome-icon icon="trash" class="h-3.5 w-3.5 opacity-80" />
            Delete
          </button>
        </div>
      </div>
      <div
        v-else
        class="ml-auto flex shrink-0 gap-1"
      >
        <button
          type="button"
          class="p-0.5 text-[var(--color-text-primary)] transition-opacity duration-200 hover:opacity-70"
          aria-label="Cancel edit"
          @click="cancelEdit"
        >
          <font-awesome-icon icon="times" class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
        <button
          type="button"
          class="p-0.5 text-emerald-500 transition-opacity duration-200 hover:opacity-80"
          aria-label="Save"
          @click="saveEdit"
        >
          <font-awesome-icon icon="check" class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>
    </div>

    <div
      class="cheat-sheet-card__code flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-xs"
      :class="isEditing ? '' : 'cursor-text'"
      :title="isEditing ? 'Save: ⌘ or Ctrl+Enter · Cancel: Esc' : 'Double-click to edit · Select text to copy'"
      @dblclick="onCodeAreaDblClick"
    >
      <textarea
        v-if="isEditing"
        ref="contentInputRef"
        v-model="editForm.content"
        placeholder="Content"
        class="cheat-sheet-card__content-input min-h-0 w-full flex-1 resize-none overflow-y-auto border-0 bg-transparent p-2.5 font-mono text-xs leading-relaxed text-[var(--color-text-primary)] outline-none ring-0 placeholder:text-[var(--color-text-primary)]/35 sm:p-3"
        title="Save: ⌘ or Ctrl+Enter — Cancel: Esc"
        spellcheck="false"
        @click.stop
        @keydown="onContentKeydown"
      />
      <div
        v-else
        class="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div
          class="min-h-0 flex-1 overflow-y-auto p-2.5 select-text sm:p-3"
        >
          <CodeHighlight :code="cheatSheet.content" />
        </div>
        <div
          class="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-[var(--color-bg-primary)] to-transparent"
          aria-hidden="true"
        />
      </div>
    </div>

    <button
      v-if="!isEditing"
      type="button"
      class="cheat-sheet-card__resize-handle absolute bottom-1.5 right-1.5 z-10 h-5 w-5 rounded-sm border border-[var(--color-border)] bg-[var(--color-bg-primary)]/80 opacity-80 transition-opacity duration-200 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
      aria-label="Resize card"
      title="Drag to resize"
      @pointerdown="onResizeHandlePointerDown"
    />
  </div>
</template>

<style scoped>
.category-tag {
  opacity: 1 !important;
}

.category-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.15rem center;
  background-size: 0.65rem;
}

.cheat-sheet-card__resize-handle {
  cursor: se-resize;
  touch-action: none;
}

.cheat-sheet-card__resize-handle::before {
  content: '';
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 8px;
  height: 8px;
  border-right: 2px solid color-mix(in srgb, var(--color-bg-accent) 65%, white);
  border-bottom: 2px solid color-mix(in srgb, var(--color-bg-accent) 65%, white);
  opacity: 0.9;
}
</style>
