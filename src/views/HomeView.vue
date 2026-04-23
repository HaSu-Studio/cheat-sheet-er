<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import SearchBar from '@/components/SearchBar.vue'
import CategoryTabs from '@/components/CategoryTabs.vue'
import CheatSheetCard from '@/components/CheatSheetCard.vue'
import AddCheatSheetCard from '@/components/AddCheatSheetCard.vue'
import CategoryHint from '@/components/CategoryHint.vue'
import CheatSheetModal from '@/components/CheatSheetModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import CategoryDialog from '@/components/CategoryDialog.vue'
import { useCheatSheetsStore } from '@/stores/cheatSheets'
import type {
  CheatSheetCardLayout,
  CheatSheetCardResizeConfig,
  CheatSheetCardResizeEvent,
} from '@/types/components'

const toast = useToast()

const store = useCheatSheetsStore()
const {
  filteredCheatSheets,
  searchQuery,
  categories,
  activeCategory,
  cheatSheets,
  categoryCounts,
  cardLayouts,
} = storeToRefs(store)

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

const isModalOpen = ref(false)
const isCategoryDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const deletingId = ref<string | null>(null)
const isDeleteCategoryDialogOpen = ref(false)
const deletingCategory = ref<string | null>(null)
const isForceDeleteDialogOpen = ref(false)
const forceDeletingCategory = ref<string | null>(null)
const initialCategory = ref<string>('')
const gridRef = ref<HTMLElement | null>(null)
const viewportWidth = ref<number>(window.innerWidth)
const viewportHeight = ref<number>(window.innerHeight)
const gridWidth = ref<number>(0)
let gridObserver: ResizeObserver | null = null

const hasNoCategories = computed(() => categories.value.length === 0)

/** Show grid (cards + add tile) or add-only when list is empty but user can add (no active search) */
const showCheatGridWithAdd = computed((): boolean => {
  if (hasNoCategories.value) return false
  const n = filteredCheatSheets.value.length
  if (n > 0) return true
  return !searchQuery.value.trim()
})

const gridGapPx = computed(() => (viewportWidth.value < 640 ? 20 : 24))

const targetColumnWidthPx = computed(() => {
  if (viewportWidth.value < 640) return 240
  if (viewportWidth.value < 1100) return 280
  return 320
})

const gridColumnCount = computed(() => {
  const width = gridWidth.value
  if (width <= 0) return 1
  const rawCount = Math.floor((width + gridGapPx.value) / (targetColumnWidthPx.value + gridGapPx.value))
  return Math.max(1, rawCount)
})

const gridColumnWidthPx = computed(() => {
  const width = gridWidth.value
  const columns = gridColumnCount.value
  if (width <= 0) return targetColumnWidthPx.value
  return Math.floor((width - (columns - 1) * gridGapPx.value) / columns)
})

const gridRowHeightPx = computed(() => {
  if (viewportWidth.value < 640) return 11
  if (viewportHeight.value < 860) return 12
  return 13
})

const defaultCardHeightPx = computed(() => {
  const isMobile = viewportWidth.value < 640
  const targetHeight = Math.round(viewportHeight.value * (isMobile ? 0.45 : 0.58))
  return clamp(targetHeight, isMobile ? 320 : 420, isMobile ? 540 : 760)
})

const defaultRowSpan = computed(() => {
  const raw = Math.round(
    (defaultCardHeightPx.value + gridGapPx.value) / (gridRowHeightPx.value + gridGapPx.value),
  )
  return clamp(raw, store.cardLayoutLimits.minRowSpan, store.cardLayoutLimits.maxRowSpan)
})

const resizeConfig = computed<CheatSheetCardResizeConfig>(() => {
  const minColSpan = store.cardLayoutLimits.minColSpan
  const maxColSpan = Math.max(
    minColSpan,
    Math.min(store.cardLayoutLimits.maxColSpan, gridColumnCount.value),
  )

  return {
    columnCount: gridColumnCount.value,
    columnWidth: gridColumnWidthPx.value,
    rowHeight: gridRowHeightPx.value,
    gap: gridGapPx.value,
    minColSpan,
    maxColSpan,
    minRowSpan: store.cardLayoutLimits.minRowSpan,
    maxRowSpan: store.cardLayoutLimits.maxRowSpan,
  }
})

const gridStyle = computed<Record<string, string>>(() => {
  return {
    gridTemplateColumns: `repeat(${gridColumnCount.value}, minmax(0, 1fr))`,
    gridAutoRows: `${gridRowHeightPx.value}px`,
    gap: `${gridGapPx.value}px`,
  }
})

const addCardStyle = computed<Record<string, string>>(() => {
  return {
    gridColumn: 'span 1 / span 1',
    gridRow: `span ${defaultRowSpan.value} / span ${defaultRowSpan.value}`,
  }
})

const resolveCardLayout = (id: string): CheatSheetCardLayout => {
  const savedLayout = cardLayouts.value[id]
  const { minColSpan, maxColSpan, minRowSpan, maxRowSpan } = resizeConfig.value
  return {
    colSpan: clamp(savedLayout?.colSpan ?? 1, minColSpan, maxColSpan),
    rowSpan: clamp(savedLayout?.rowSpan ?? defaultRowSpan.value, minRowSpan, maxRowSpan),
  }
}

const updateViewportMetrics = (): void => {
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
}

const updateGridWidth = (): void => {
  gridWidth.value = Math.max(0, Math.floor(gridRef.value?.clientWidth ?? 0))
}

const attachGridObserver = (): void => {
  if (!gridRef.value) return
  if (!gridObserver) {
    gridObserver = new ResizeObserver(() => {
      updateGridWidth()
    })
  }
  gridObserver.disconnect()
  gridObserver.observe(gridRef.value)
}

const detachGridObserver = (): void => {
  if (!gridObserver) return
  gridObserver.disconnect()
}

const handleCardResize = (event: CheatSheetCardResizeEvent): void => {
  store.setCardLayout(event.id, event.layout)
}

const handleSearch = (query: string): void => {
  store.setSearchQuery(query)
}

const handleCategoryChange = (category: string | null): void => {
  store.setActiveCategory(category)
}

/** New sheet: pre-fill category from active tab when set */
const openCreateWithActiveCategory = (): void => {
  initialCategory.value = activeCategory.value?.trim() ?? ''
  isModalOpen.value = true
}

const handleCreateCategory = (): void => {
  isCategoryDialogOpen.value = true
}

const handleCategorySave = async (category: string): Promise<void> => {
  try {
    await store.addCategory(category)
    isCategoryDialogOpen.value = false
    toast.success(`Category "${category}" created`)
  } catch {
    toast.error('Failed to create category')
  }
}

const handleCloseCategoryDialog = (): void => {
  isCategoryDialogOpen.value = false
}

const handleDeleteCategoryRequest = (category: string): void => {
  // Check if category has cheat sheets
  const hasCheatSheets: boolean = cheatSheets.value.some(
    (sheet) => sheet.category === category,
  )

  if (hasCheatSheets) {
    forceDeletingCategory.value = category
    isForceDeleteDialogOpen.value = true
  } else {
    deletingCategory.value = category
    isDeleteCategoryDialogOpen.value = true
  }
}

const handleDeleteCategoryConfirm = async (): Promise<void> => {
  if (deletingCategory.value) {
    const success: boolean = await store.deleteCategory(deletingCategory.value)

    if (success) {
      // If we were viewing this category, switch to "All"
      if (activeCategory.value === deletingCategory.value) {
        store.setActiveCategory(null)
      }
      toast.success(`Category "${deletingCategory.value}" deleted`)
    } else {
      toast.error(`Cannot delete category "${deletingCategory.value}" - it contains cheat sheets`)
    }
    deletingCategory.value = null
  }
  isDeleteCategoryDialogOpen.value = false
}

const handleDeleteCategoryCancel = (): void => {
  deletingCategory.value = null
  isDeleteCategoryDialogOpen.value = false
}

const handleForceDeleteCategoryConfirm = async (): Promise<void> => {
  if (forceDeletingCategory.value) {
    const success: boolean = await store.forceDeleteCategory(forceDeletingCategory.value)

    if (success) {
      // If we were viewing this category, switch to "All"
      if (activeCategory.value === forceDeletingCategory.value) {
        store.setActiveCategory(null)
      }
      toast.success(`Category "${forceDeletingCategory.value}" and all its cheat sheets deleted`)
    } else {
      toast.error(`Failed to delete category "${forceDeletingCategory.value}"`)
    }
    forceDeletingCategory.value = null
  }
  isForceDeleteDialogOpen.value = false
}

const handleForceDeleteCategoryCancel = (): void => {
  forceDeletingCategory.value = null
  isForceDeleteDialogOpen.value = false
}

const handleDeleteRequest = (id: string): void => {
  deletingId.value = id
  isDeleteDialogOpen.value = true
}

const handleDeleteConfirm = async (): Promise<void> => {
  if (deletingId.value) {
    try {
      await store.deleteCheatSheet(deletingId.value)
      toast.success('Cheat sheet deleted')
    } catch {
      toast.error('Failed to delete cheat sheet')
    }
    deletingId.value = null
  }
  isDeleteDialogOpen.value = false
}

const handleDeleteCancel = (): void => {
  deletingId.value = null
  isDeleteDialogOpen.value = false
}

const handleCreateSave = async (data: {
  title: string
  category: string
  content: string
}): Promise<void> => {
  try {
    await store.addCheatSheet({
      title: data.title,
      category: data.category,
      content: data.content,
    })
    toast.success('Cheat sheet created!')
    isModalOpen.value = false
  } catch {
    toast.error('Failed to create cheat sheet')
  }
}

const handleCloseModal = (): void => {
  isModalOpen.value = false
  initialCategory.value = ''
}

const handleWindowResize = (): void => {
  updateViewportMetrics()
  updateGridWidth()
}

watch(
  () => showCheatGridWithAdd.value,
  async (isVisible: boolean) => {
    if (!isVisible) {
      detachGridObserver()
      return
    }
    await nextTick()
    updateGridWidth()
    attachGridObserver()
  },
  { immediate: true },
)

// Initialize data and layout metrics on mount
onMounted(async () => {
  updateViewportMetrics()
  window.addEventListener('resize', handleWindowResize)
  try {
    await Promise.all([
      store.fetchCheatSheets(),
      store.fetchCategories(),
    ])
  } catch (error) {
    toast.error('Failed to load data')
    console.error('Failed to initialize data:', error)
  } finally {
    await nextTick()
    updateGridWidth()
    if (showCheatGridWithAdd.value) {
      attachGridObserver()
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
  if (gridObserver) {
    gridObserver.disconnect()
    gridObserver = null
  }
})
</script>

<template>
  <main
    class="dashboard mx-auto w-full max-w-[90vw] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
  >
    <div class="dashboard__stack flex flex-col gap-8">
      <header class="dashboard__toolbar shrink-0">
        <h2 class="sr-only">Search</h2>
        <SearchBar
          class="w-full min-w-0 max-w-xl"
          :model-value="searchQuery"
          @update:model-value="handleSearch"
        />
      </header>

      <section class="dashboard__filters shrink-0" aria-label="Categories">
        <h2 class="sr-only">Categories</h2>
        <CategoryTabs
          :categories="categories"
          :active-category="activeCategory"
          :total-count="cheatSheets.length"
          :category-counts="categoryCounts"
          @update:active-category="handleCategoryChange"
          @create-category="handleCreateCategory"
          @delete-category="handleDeleteCategoryRequest"
        />
      </section>

      <section
        class="dashboard__content min-h-[min(40vh,20rem)] flex-1"
        aria-label="Cheat sheets"
      >
        <h2 class="sr-only">Your cheat sheets</h2>

        <div
          v-if="hasNoCategories"
          class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-8 sm:p-10"
        >
          <CategoryHint @create-category="handleCreateCategory" />
        </div>

        <div
          v-else-if="showCheatGridWithAdd"
          ref="gridRef"
          class="cheat-sheet-grid grid"
          :style="gridStyle"
        >
          <CheatSheetCard
            v-for="cheatSheet in filteredCheatSheets"
            :key="cheatSheet.id"
            :cheat-sheet="cheatSheet"
            :layout="resolveCardLayout(cheatSheet.id)"
            :resize-config="resizeConfig"
            @delete="handleDeleteRequest"
            @resize="handleCardResize"
          />
          <AddCheatSheetCard
            :active-category="activeCategory"
            :style="addCardStyle"
            @click="openCreateWithActiveCategory"
          />
        </div>

        <div
          v-else
          class="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 px-6 py-16 text-center"
        >
          <div class="text-[var(--color-text-secondary)]">
            <font-awesome-icon
              icon="file-alt"
              class="mx-auto mb-4 h-14 w-14 opacity-50 sm:h-16 sm:w-16"
            />
            <p class="text-base sm:text-lg">No cheat sheets found for your search</p>
            <p class="mt-2 text-sm opacity-70">Try a different search or clear the search box</p>
          </div>
        </div>
      </section>
    </div>
  </main>

  <!-- Modals -->
  <CheatSheetModal
    :is-open="isModalOpen"
    :initial-category="initialCategory"
    @close="handleCloseModal"
    @save="handleCreateSave"
  />

  <ConfirmDialog
    :is-open="isDeleteDialogOpen"
    title="Delete Cheat Sheet"
    message="Are you sure you want to delete this cheat sheet? This action cannot be undone."
    confirm-text="Delete"
    cancel-text="Cancel"
    :is-danger="true"
    @confirm="handleDeleteConfirm"
    @cancel="handleDeleteCancel"
  />

  <CategoryDialog
    :is-open="isCategoryDialogOpen"
    :existing-categories="categories"
    @close="handleCloseCategoryDialog"
    @save="handleCategorySave"
  />

  <ConfirmDialog
    :is-open="isDeleteCategoryDialogOpen"
    title="Delete Category"
    :message="`Are you sure you want to delete the category '${deletingCategory}'?`"
    confirm-text="Delete"
    cancel-text="Cancel"
    :is-danger="true"
    @confirm="handleDeleteCategoryConfirm"
    @cancel="handleDeleteCategoryCancel"
  />

  <ConfirmDialog
    :is-open="isForceDeleteDialogOpen"
    title="Delete Category with Cheat Sheets"
    :message="`The category '${forceDeletingCategory}' contains cheat sheets. Deleting it will also delete all cheat sheets in this category. This action cannot be undone. Are you sure?`"
    confirm-text="Delete All"
    cancel-text="Cancel"
    :is-danger="true"
    @confirm="handleForceDeleteCategoryConfirm"
    @cancel="handleForceDeleteCategoryCancel"
  />
</template>
