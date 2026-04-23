import type { CheatSheet } from './index'

// AuthGuard Props
export interface AuthGuardProps {
  requireAuth?: boolean
}

// CategoryTabs Props
export interface CategoryTabsProps {
  categories: string[]
  activeCategory: string | null
  totalCount: number
  categoryCounts: Record<string, number>
}

// AddCheatSheetCard (grid placeholder, same cell size as a sheet card)
export interface AddCheatSheetCardProps {
  activeCategory?: string | null
}

// ConfirmDialog Props
export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDanger?: boolean
}

// CategoryDialog Props
export interface CategoryDialogProps {
  isOpen: boolean
  existingCategories: string[]
}

// CheatSheetModal Props (create only; existing sheets are edited in-place on the card)
export interface CheatSheetModalProps {
  isOpen: boolean
  initialCategory?: string
}

// CheatSheetModal Save Data
export interface CheatSheetFormData {
  title: string
  category: string
  content: string
}

export interface CheatSheetCardLayout {
  colSpan: number
  rowSpan: number
}

export interface CheatSheetCardResizeConfig {
  columnCount: number
  columnWidth: number
  rowHeight: number
  gap: number
  minColSpan: number
  maxColSpan: number
  minRowSpan: number
  maxRowSpan: number
}

export interface CheatSheetCardResizeEvent {
  id: string
  layout: CheatSheetCardLayout
}

// CheatSheetCard Props
export interface CheatSheetCardProps {
  cheatSheet: CheatSheet
  layout: CheatSheetCardLayout
  resizeConfig: CheatSheetCardResizeConfig
}

// CodeHighlight Props
export interface CodeHighlightProps {
  code: string
  language?: string
  autoDetect?: boolean
}

// SearchBar Props
export interface SearchBarProps {
  modelValue: string
}

// Category Color Interface
export interface CategoryColor {
  bg: string
  bgHover: string
  bgActive: string
  border: string
  borderHover: string
  text: string
}
