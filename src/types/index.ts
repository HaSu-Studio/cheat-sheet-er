// ============================================
// Domain Models
// ============================================

export interface CheatSheet {
  id: string
  title: string
  category: string
  content: string
  createdAt: string
  updatedAt: string
}

export type CheatSheetInput = Omit<CheatSheet, 'id' | 'createdAt' | 'updatedAt'>

export type CheatSheetUpdate = Partial<CheatSheetInput>

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

// ============================================
// Auth Types
// ============================================

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
  confirmPassword: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// ============================================
// API Types
// ============================================

export interface AuthResponse {
  access_token: string
  user: User
}

export interface ApiError {
  message: string
  statusCode: number
}

// ============================================
// Component Types
// ============================================

export * from './components'

// ============================================
// Composable Types
// ============================================

export * from './composables'

// ============================================
// View Types
// ============================================

export * from './views'
