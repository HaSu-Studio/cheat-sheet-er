import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { CheatSheet, CheatSheetInput, CheatSheetUpdate } from '@/types'
import { api } from '@/services/api'
import { useLocalStorage } from '@/composables/useLocalStorage'

interface CardLayout {
  colSpan: number
  rowSpan: number
}

type CardLayoutMap = Record<string, CardLayout>
type CheatSheetOrder = string[]

const CARD_LAYOUT_STORAGE_KEY = 'cheat-sheet-card-layout-v2'
const CARD_ORDER_STORAGE_KEY = 'cheat-sheet-order-v1'
const CARD_LAYOUT_LIMITS = {
  minColSpan: 8,
  maxColSpan: 96,
  minRowSpan: 8,
  maxRowSpan: 120,
} as const

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

const sanitizeCardLayout = (value: unknown): CardLayout | null => {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<CardLayout>
  const colSpan = raw.colSpan
  const rowSpan = raw.rowSpan
  if (typeof colSpan !== 'number' || !Number.isFinite(colSpan)) {
    return null
  }
  if (typeof rowSpan !== 'number' || !Number.isFinite(rowSpan)) {
    return null
  }
  return {
    colSpan: clamp(Math.round(colSpan), CARD_LAYOUT_LIMITS.minColSpan, CARD_LAYOUT_LIMITS.maxColSpan),
    rowSpan: clamp(Math.round(rowSpan), CARD_LAYOUT_LIMITS.minRowSpan, CARD_LAYOUT_LIMITS.maxRowSpan),
  }
}

const sanitizeCardLayouts = (value: unknown): CardLayoutMap => {
  if (!value || typeof value !== 'object') return {}
  const raw = value as Record<string, unknown>
  const normalized: CardLayoutMap = {}

  Object.entries(raw).forEach(([id, layout]) => {
    const clean = sanitizeCardLayout(layout)
    if (clean) {
      normalized[id] = clean
    }
  })

  return normalized
}

const sanitizeOrder = (value: unknown): CheatSheetOrder => {
  if (!Array.isArray(value)) return []
  const unique = new Set<string>()
  value.forEach((id) => {
    if (typeof id === 'string' && id.trim() && !unique.has(id)) {
      unique.add(id)
    }
  })
  return Array.from(unique)
}

export const useCheatSheetsStore = defineStore('cheatSheets', () => {
  const cheatSheets = ref<CheatSheet[]>([])
  const customCategories = ref<string[]>([])
  const searchQuery = ref<string>('')
  const activeCategory = ref<string | null>(null)
  const isLoading = ref<boolean>(false)
  const layoutStorage = useLocalStorage<CardLayoutMap>(CARD_LAYOUT_STORAGE_KEY, {})
  const orderStorage = useLocalStorage<CheatSheetOrder>(CARD_ORDER_STORAGE_KEY, [])
  const cardLayouts = ref<CardLayoutMap>(sanitizeCardLayouts(layoutStorage.getItem()))
  const cheatSheetOrder = ref<CheatSheetOrder>(sanitizeOrder(orderStorage.getItem()))

  const persistCardLayouts = (): void => {
    layoutStorage.setItem(cardLayouts.value)
  }

  const persistCheatSheetOrder = (): void => {
    orderStorage.setItem(cheatSheetOrder.value)
  }

  const applyCheatSheetOrder = (): void => {
    if (cheatSheets.value.length <= 1) return
    const orderMap: Map<string, number> = new Map(
      cheatSheetOrder.value.map((id, index) => [id, index]),
    )
    cheatSheets.value = [...cheatSheets.value].sort((a, b) => {
      const aPos = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER
      const bPos = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER
      return aPos - bPos
    })
  }

  const syncCheatSheetOrder = (): void => {
    const validIds: string[] = cheatSheets.value.map((sheet) => sheet.id)
    const validSet: Set<string> = new Set(validIds)
    const existingValid = cheatSheetOrder.value.filter((id) => validSet.has(id))
    const missing = validIds.filter((id) => !existingValid.includes(id))
    const nextOrder = [...existingValid, ...missing]
    const hasChanged =
      nextOrder.length !== cheatSheetOrder.value.length ||
      nextOrder.some((id, index) => id !== cheatSheetOrder.value[index])

    if (hasChanged) {
      cheatSheetOrder.value = nextOrder
      persistCheatSheetOrder()
    }

    applyCheatSheetOrder()
  }

  const syncCardLayouts = (): void => {
    const validIds: Set<string> = new Set(cheatSheets.value.map((sheet) => sheet.id))
    const nextLayouts: CardLayoutMap = {}
    let hasChanges = false

    Object.entries(cardLayouts.value).forEach(([id, layout]) => {
      if (validIds.has(id)) {
        nextLayouts[id] = layout
      } else {
        hasChanges = true
      }
    })

    if (hasChanges) {
      cardLayouts.value = nextLayouts
      persistCardLayouts()
    }
  }

  // Getters
  const filteredCheatSheets = computed<CheatSheet[]>(() => {
    let filtered: CheatSheet[] = cheatSheets.value

    // Filter by category
    if (activeCategory.value) {
      filtered = filtered.filter((sheet) => sheet.category === activeCategory.value)
    }

    // Filter by search query
    if (searchQuery.value.trim()) {
      const query: string = searchQuery.value.toLowerCase()
      filtered = filtered.filter(
        (sheet) =>
          sheet.title.toLowerCase().includes(query) ||
          sheet.category.toLowerCase().includes(query) ||
          sheet.content.toLowerCase().includes(query),
      )
    }

    return filtered
  })

  const categories = computed<string[]>(() => {
    // Combine custom categories and categories from cheat sheets
    const fromSheets: string[] = cheatSheets.value
      .map((sheet) => sheet.category)
      .filter((category) => category.trim())
    const allCategories: Set<string> = new Set([...customCategories.value, ...fromSheets])
    return Array.from(allCategories).sort()
  })

  const categoryCounts = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {}
    cheatSheets.value.forEach((sheet) => {
      if (sheet.category) {
        counts[sheet.category] = (counts[sheet.category] || 0) + 1
      }
    })
    return counts
  })

  const getById = (id: string): CheatSheet | undefined => {
    return cheatSheets.value.find((sheet) => sheet.id === id)
  }

  // Actions
  const fetchCheatSheets = async (): Promise<void> => {
    isLoading.value = true
    try {
      const sheets: CheatSheet[] = await api.getCheatSheets()
      cheatSheets.value = sheets
      syncCheatSheetOrder()
      syncCardLayouts()
    } catch (error) {
      console.error('Failed to fetch cheat sheets:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchCategories = async (): Promise<void> => {
    try {
      const cats: string[] = await api.getCategories()
      customCategories.value = cats
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      throw error
    }
  }

  const addCategory = async (category: string): Promise<void> => {
    const trimmed: string = category.trim()
    if (!trimmed) return
    if (customCategories.value.includes(trimmed)) return

    try {
      await api.createCategory(trimmed)
      await fetchCategories()
    } catch (error) {
      console.error('Failed to add category:', error)
      throw error
    }
  }

  const deleteCategory = async (category: string): Promise<boolean> => {
    // Check if there are any cheat sheets using this category
    const hasCheatSheets: boolean = cheatSheets.value.some((sheet) => sheet.category === category)
    if (hasCheatSheets) {
      return false // Cannot delete category with cheat sheets
    }

    try {
      await api.deleteCategory(category, false)
      await fetchCategories()
      return true
    } catch (error) {
      console.error('Failed to delete category:', error)
      return false
    }
  }

  const forceDeleteCategory = async (category: string): Promise<boolean> => {
    try {
      await api.deleteCategory(category, true)
      await fetchCategories()
      await fetchCheatSheets()
      return true
    } catch (error) {
      console.error('Failed to force delete category:', error)
      return false
    }
  }

  const addCheatSheet = async (input: CheatSheetInput): Promise<CheatSheet> => {
    try {
      const newSheet: CheatSheet = await api.createCheatSheet(input)
      cheatSheets.value.push(newSheet)
      cheatSheetOrder.value = [...cheatSheetOrder.value.filter((id) => id !== newSheet.id), newSheet.id]
      persistCheatSheetOrder()
      applyCheatSheetOrder()
      syncCardLayouts()
      return newSheet
    } catch (error) {
      console.error('Failed to add cheat sheet:', error)
      throw error
    }
  }

  const updateCheatSheet = async (id: string, updates: CheatSheetUpdate): Promise<void> => {
    try {
      const updatedSheet: CheatSheet = await api.updateCheatSheet(id, updates)
      const index: number = cheatSheets.value.findIndex((sheet) => sheet.id === id)
      if (index !== -1) {
        cheatSheets.value[index] = updatedSheet
      }
    } catch (error) {
      console.error('Failed to update cheat sheet:', error)
      throw error
    }
  }

  const deleteCheatSheet = async (id: string): Promise<void> => {
    try {
      await api.deleteCheatSheet(id)
      const index: number = cheatSheets.value.findIndex((sheet) => sheet.id === id)
      if (index !== -1) {
        cheatSheets.value.splice(index, 1)
      }
      if (cheatSheetOrder.value.includes(id)) {
        cheatSheetOrder.value = cheatSheetOrder.value.filter((itemId) => itemId !== id)
        persistCheatSheetOrder()
      }
      if (cardLayouts.value[id]) {
        const nextLayouts: CardLayoutMap = { ...cardLayouts.value }
        delete nextLayouts[id]
        cardLayouts.value = nextLayouts
        persistCardLayouts()
      }
    } catch (error) {
      console.error('Failed to delete cheat sheet:', error)
      throw error
    }
  }

  const setCardLayout = (id: string, layout: CardLayout): void => {
    const sanitized = sanitizeCardLayout(layout)
    if (!sanitized) return
    cardLayouts.value = {
      ...cardLayouts.value,
      [id]: sanitized,
    }
    persistCardLayouts()
  }

  const setCardLayouts = (layouts: CardLayoutMap): number => {
    const nextLayouts: CardLayoutMap = { ...cardLayouts.value }
    let changes = 0

    Object.entries(layouts).forEach(([id, layout]) => {
      const sanitized = sanitizeCardLayout(layout)
      if (!sanitized) return
      const current = nextLayouts[id]
      if (
        !current ||
        current.colSpan !== sanitized.colSpan ||
        current.rowSpan !== sanitized.rowSpan
      ) {
        nextLayouts[id] = sanitized
        changes += 1
      }
    })

    if (changes > 0) {
      cardLayouts.value = nextLayouts
      persistCardLayouts()
    }

    return changes
  }

  const clearCardLayout = (id: string): void => {
    if (!cardLayouts.value[id]) return
    const nextLayouts: CardLayoutMap = { ...cardLayouts.value }
    delete nextLayouts[id]
    cardLayouts.value = nextLayouts
    persistCardLayouts()
  }

  const moveCheatSheet = (id: string, direction: 'prev' | 'next', scopeIds?: string[]): boolean => {
    const offset = direction === 'prev' ? -1 : 1
    if (!cheatSheetOrder.value.length) return false

    const order = [...cheatSheetOrder.value]
    const hasScope = Array.isArray(scopeIds) && scopeIds.length > 1
    if (!hasScope) {
      const index = order.indexOf(id)
      if (index === -1) return false
      const targetIndex = index + offset
      if (targetIndex < 0 || targetIndex >= order.length) return false
      const currentId = order[index]
      const targetId = order[targetIndex]
      if (!currentId || !targetId) return false
      order[index] = targetId
      order[targetIndex] = currentId
      cheatSheetOrder.value = order
      persistCheatSheetOrder()
      applyCheatSheetOrder()
      return true
    }

    const scopeSet = new Set(scopeIds)
    const scopedOrder = order.filter((itemId) => scopeSet.has(itemId))
    const scopedIndex = scopedOrder.indexOf(id)
    if (scopedIndex === -1) return false
    const targetScopedIndex = scopedIndex + offset
    if (targetScopedIndex < 0 || targetScopedIndex >= scopedOrder.length) return false

    const currentScopedId = scopedOrder[scopedIndex]
    const targetScopedId = scopedOrder[targetScopedIndex]
    if (!currentScopedId || !targetScopedId) return false
    scopedOrder[scopedIndex] = targetScopedId
    scopedOrder[targetScopedIndex] = currentScopedId

    let scopedCursor = 0
    const mergedOrder: CheatSheetOrder = order.map((itemId) => {
      if (!scopeSet.has(itemId)) return itemId
      const nextId = scopedOrder[scopedCursor]
      scopedCursor += 1
      return nextId ?? itemId
    })

    cheatSheetOrder.value = mergedOrder
    persistCheatSheetOrder()
    applyCheatSheetOrder()
    return true
  }

  const setSearchQuery = (query: string): void => {
    searchQuery.value = query
  }

  const clearSearch = (): void => {
    searchQuery.value = ''
  }

  const setActiveCategory = (category: string | null): void => {
    activeCategory.value = category
  }

  return {
    // State
    cheatSheets: computed(() => cheatSheets.value),
    searchQuery: computed(() => searchQuery.value),
    activeCategory: computed(() => activeCategory.value),
    isLoading: computed(() => isLoading.value),
    cardLayouts: computed(() => cardLayouts.value),
    cardLayoutLimits: CARD_LAYOUT_LIMITS,

    // Getters
    filteredCheatSheets,
    categories,
    categoryCounts,
    getById,

    // Actions
    fetchCheatSheets,
    fetchCategories,
    addCheatSheet,
    updateCheatSheet,
    deleteCheatSheet,
    setCardLayout,
    setCardLayouts,
    clearCardLayout,
    moveCheatSheet,
    setSearchQuery,
    clearSearch,
    setActiveCategory,
    addCategory,
    deleteCategory,
    forceDeleteCategory,
  }
})
