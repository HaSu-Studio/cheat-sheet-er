<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useNavigation } from '@/composables/useNavigation'
import { AppButton } from '@/components/shared'

const authStore = useAuthStore()
const { user, isAuthenticated } = storeToRefs(authStore)

const {
  navigateToLogin: handleLogin,
  navigateToRegister: handleRegister,
  navigateToProfile: handleProfile,
  navigateToDashboard,
  navigateToHome,
  logout: handleLogout,
} = useNavigation()

const handleLogoClick = (): void => {
  if (isAuthenticated.value) {
    navigateToDashboard()
  } else {
    navigateToHome()
  }
}
</script>

<template>
  <header class="border-b border-[var(--color-border)]">
    <div class="mx-auto w-full max-w-[90vw] px-4 py-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">
        <button @click="handleLogoClick" class="text-left hover:opacity-80 transition-opacity duration-200">
          <h1 class="text-2xl font-light text-[var(--color-text-primary)]">Notareon</h1>
          <p class="text-sm mt-1 text-[var(--color-text-primary)] opacity-80">
            Your personal cheat sheets collection
          </p>
        </button>

        <!-- Authentication Section -->
        <div v-if="!isAuthenticated" class="flex items-center space-x-4">
          <AppButton
            variant="primary"
            icon="sign-in-alt"
            @click="handleLogin"
          >
            Sign In
          </AppButton>
          <AppButton
            variant="emerald"
            icon="user-plus"
            @click="handleRegister"
          >
            Sign Up
          </AppButton>
        </div>

        <!-- User Section -->
        <div v-else class="flex items-center space-x-4">
          <div class="text-right">
            <p class="text-sm font-medium text-[var(--color-text-primary)]">
              {{ user?.name }}
            </p>
            <p class="text-xs text-[var(--color-text-secondary)]">
              {{ user?.email }}
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="handleProfile"
              class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
              title="Profile"
            >
              <font-awesome-icon icon="user" class="w-5 h-5" />
            </button>
            <button
              @click="handleLogout"
              class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
              title="Sign Out"
            >
              <font-awesome-icon icon="sign-out-alt" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
