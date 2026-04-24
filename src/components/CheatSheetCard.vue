<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import CodeHighlight from './CodeHighlight.vue'
import { useCheatSheetsStore } from '@/stores/cheatSheets'
import { useCategoryColors } from '@/composables/useCategoryColors'
import { estimateCardRowSpan } from '@/utils/cardLayout'
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
  'move-prev': [id: string]
  'move-next': [id: string]
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

const saveEdit = async (): Promise<void> => {
  const nextTitle = editForm.value.title.trim()
  const nextCategory = editForm.value.category.trim()
  const nextContent = editForm.value.content.trim()

  if (!nextTitle || !nextContent) {
    toast.warning('Title and content are required')
    return
  }

  if (!nextCategory) {
    toast.warning('Choose a category')
    return
  }

  try {
    await store.updateCheatSheet(props.cheatSheet.id, {
      title: nextTitle,
      category: nextCategory,
      content: nextContent,
    })

    const recommendedRowSpan = estimateCardRowSpan(
      nextContent,
      localLayout.value.colSpan,
      props.resizeConfig,
    )

    if (recommendedRowSpan < localLayout.value.rowSpan) {
      localLayout.value = {
        ...localLayout.value,
        rowSpan: recommendedRowSpan,
      }
      emit('resize', {
        id: props.cheatSheet.id,
        layout: { ...localLayout.value },
      })
    }

    isEditing.value = false
    toast.success('Cheat sheet updated!')
  } catch (error) {
    console.error('Failed to update cheat sheet:', error)
    toast.error('Failed to update cheat sheet')
  }
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

const canMovePrev = computed(() => props.canMovePrev !== false)
const canMoveNext = computed(() => props.canMoveNext !== false)

const movePrev = (): void => {
  if (!canMovePrev.value || isEditing.value) return
  emit('move-prev', props.cheatSheet.id)
}

const moveNext = (): void => {
  if (!canMoveNext.value || isEditing.value) return
  emit('move-next', props.cheatSheet.id)
}

const resizePreviewLabel = computed(() => {
  const width = spanToPixels(localLayout.value.colSpan, props.resizeConfig.columnWidth, props.resizeConfig.gap)
  const height = spanToPixels(localLayout.value.rowSpan, props.resizeConfig.rowHeight, props.resizeConfig.gap)
  return `${Math.round(width)}×${Math.round(height)} · ${localLayout.value.colSpan}x${localLayout.value.rowSpan}`
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
      'cheat-sheet-card relative group flex h-full w-full min-h-0 flex-col overflow-hidden rounded-lg border bg-[var(--color-bg-secondary)] transition-colors duration-200',
      isEditing ? 'border-[var(--color-bg-accent)] ring-1 ring-[var(--color-bg-accent)]/30' : '',
      menuOpen ? 'z-40' : 'z-0',
      isResizing ? 'cursor-se-resize select-none' : '',
    ]"
    :style="cardStyle"
  >
    <div
      class="cheat-sheet-card__meta cheat-sheet-card__toolbar flex min-h-0 shrink-0 items-center rounded-md border border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/35"
    >
      <input
        v-if="isEditing"
        v-model="editForm.title"
        type="text"
        placeholder="Title"
        class="cheat-sheet-card__title-input min-w-0 flex-1 border-0 border-b border-dashed border-[var(--color-border)] bg-transparent py-0.5 font-medium leading-tight text-[var(--color-text-primary)] outline-none ring-0 placeholder:text-[var(--color-text-primary)]/40 focus:border-[var(--color-bg-accent)]"
        :style="titleStyle"
      />
      <h3
        v-else
        class="cheat-sheet-card__title min-w-0 flex-1 cursor-text select-text truncate font-medium leading-tight text-[var(--color-text-primary)] transition-colors duration-200"
        :style="titleStyle"
        title="Double-click to edit"
        @dblclick="startEdit"
      >
        {{ cheatSheet.title }}
      </h3>
    </div>

    <div
      class="cheat-sheet-card__code flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)]"
      :class="isEditing ? '' : 'cursor-text'"
      :title="isEditing ? 'Save: ⌘ or Ctrl+Enter · Cancel: Esc' : 'Double-click to edit · Select text to copy'"
      @dblclick="onCodeAreaDblClick"
    >
      <textarea
        v-if="isEditing"
        ref="contentInputRef"
        v-model="editForm.content"
        placeholder="Content"
        class="cheat-sheet-card__content-input min-h-0 w-full flex-1 resize-none overflow-y-auto border-0 bg-transparent font-mono leading-relaxed text-[var(--color-text-primary)] outline-none ring-0 placeholder:text-[var(--color-text-primary)]/35"
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
          class="cheat-sheet-card__scroll-inner min-h-0 flex-1 overflow-y-auto select-text"
        >
          <CodeHighlight :code="cheatSheet.content" />
        </div>
        <div
          class="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-[var(--color-bg-primary)] to-transparent"
          aria-hidden="true"
        />
      </div>
    </div>

    <!-- Bottom footer: date, category, actions -->
    <div class="cheat-sheet-card__footer flex shrink-0 items-center gap-1.5" style="margin-block: 0; padding-block: 0;">
      <span
        class="cheat-sheet-card__meta-date shrink-0 whitespace-nowrap tabular-nums leading-none text-[var(--color-text-primary)] opacity-50"
      >{{ formatDate(cheatSheet.updatedAt) }}</span>

      <select
        v-if="isEditing"
        v-model="editForm.category"
        class="category-select cheat-sheet-card__category-control category-tag max-w-[40%] min-w-[5.5rem] shrink-0 cursor-pointer truncate rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] py-0.5 pl-1 pr-5 text-left font-medium text-[var(--color-text-primary)] outline-none ring-0 focus:border-[var(--color-bg-accent)]"
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
        class="category-tag cheat-sheet-card__category-pill max-w-[40%] min-w-0 shrink-0 truncate rounded border px-1.5 py-0.5 font-medium leading-none transition-all duration-200"
        :style="getCategoryStyles(cheatSheet.category)"
      >
        {{ cheatSheet.category }}
      </span>

      <div class="ml-auto flex shrink-0 items-center gap-0.5">
        <template v-if="!isEditing">
          <button
            type="button"
            class="rounded px-0.5 py-0 text-[var(--color-text-primary)] opacity-80 transition-opacity duration-200 hover:bg-[var(--color-bg-primary)] hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Move card up"
            title="Move up"
            :disabled="!canMovePrev"
            @click.stop="movePrev"
          >
            <font-awesome-icon icon="arrow-up" class="h-1.5 w-1.5" />
          </button>
          <button
            type="button"
            class="rounded px-0.5 py-0 text-[var(--color-text-primary)] opacity-80 transition-opacity duration-200 hover:bg-[var(--color-bg-primary)] hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Move card down"
            title="Move down"
            :disabled="!canMoveNext"
            @click.stop="moveNext"
          >
            <font-awesome-icon icon="arrow-down" class="h-1.5 w-1.5" />
          </button>

          <div
            ref="menuRootRef"
            class="relative z-[1] shrink-0"
          >
            <button
              type="button"
              class="rounded px-0.5 py-0 text-[var(--color-text-primary)] opacity-100 transition-opacity duration-200 hover:bg-[var(--color-bg-primary)] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              aria-label="Open menu"
              :aria-expanded="menuOpen"
              @click.stop="menuOpen = !menuOpen"
            >
              <font-awesome-icon icon="ellipsis-vertical" class="h-2 w-2" />
            </button>
            <div
              v-show="menuOpen"
              class="absolute right-0 bottom-full z-50 mb-1 min-w-[10.5rem] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] py-1 shadow-xl"
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
        </template>
        <template v-else>
          <button
            type="button"
            class="px-0.5 py-0 text-[var(--color-text-primary)] transition-opacity duration-200 hover:opacity-70"
            aria-label="Cancel edit"
            @click="cancelEdit"
          >
            <font-awesome-icon icon="times" class="h-1.5 w-1.5" />
          </button>
          <button
            type="button"
            class="px-0.5 py-0 text-emerald-500 transition-opacity duration-200 hover:opacity-80"
            aria-label="Save"
            @click="saveEdit"
          >
            <font-awesome-icon icon="check" class="h-1.5 w-1.5" />
          </button>
        </template>
      </div>
    </div>

    <div
      v-if="isResizing"
      class="pointer-events-none absolute inset-1 rounded-md border border-dashed border-[var(--color-bg-accent)]/80 bg-[var(--color-bg-accent)]/10"
      aria-hidden="true"
    />

    <div
      v-if="isResizing"
      class="pointer-events-none absolute bottom-8 right-2 rounded bg-black/60 px-2 py-1 text-[10px] font-medium text-white"
      aria-hidden="true"
    >
      {{ resizePreviewLabel }}
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
/* Карточка как контейнер: типографика и отступы от ширины и высоты ячейки (ресайз грида) */
.cheat-sheet-card {
  container-type: size;
  container-name: cheat-sheet-card;
  padding: clamp(0.35rem, 0.3rem + 1.1cqmin, 0.9rem);
  gap: clamp(0.3rem, 0.2rem + 0.9cqmin, 0.75rem);
}

.cheat-sheet-card__toolbar {
  gap: clamp(0.2rem, 0.15rem + 0.8cqmin, 0.5rem);
  padding-inline: clamp(0.3rem, 0.25rem + 1.5cqi, 0.65rem);
  padding-block: clamp(0.15rem, 0.1rem + 0.55cqmin, 0.45rem);
}

.cheat-sheet-card__title,
.cheat-sheet-card__title-input {
  font-size: clamp(13px, 0.32rem + 2.1cqmin, 1rem);
  padding-inline: clamp(0.3rem, 0.25rem + 1.5cqi, 0.75rem);
  padding-block: clamp(0.25rem, 0.2rem + 0.9cqmin, 0.55rem);
}

.cheat-sheet-card__footer {
  gap: clamp(0.2rem, 0.15rem + 0.8cqmin, 0.5rem);
  /* right padding to keep buttons away from the absolute resize handle (w-5 + right-1.5 ≈ 1.65rem) */
  padding-right: 1.75rem;
  padding-block: 0;
}

.cheat-sheet-card__meta-date {
  font-size: clamp(10px, 0.15rem + 1.1cqmin, 0.72rem);
}

.cheat-sheet-card__category-pill,
.cheat-sheet-card__category-control {
  font-size: clamp(13px, 0.18rem + 1.35cqmin, 0.875rem);
}

.cheat-sheet-card__code {
  font-size: clamp(13px, 0.22rem + 1.65cqmin, 0.9375rem);
  line-height: 1.45;
}

.cheat-sheet-card__scroll-inner,
.cheat-sheet-card__content-input {
  padding-inline: clamp(0.3rem, 0.2rem + 1.1cqmin, 0.75rem);
  padding-top: clamp(0.3rem, 0.2rem + 1.1cqmin, 0.75rem);
  padding-bottom: 0;
}

.cheat-sheet-card__scroll-inner :deep(pre),
.cheat-sheet-card__scroll-inner :deep(code) {
  font-size: inherit;
}

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
