<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useNavigation } from '@/composables/useNavigation'
import type { AuthGuardProps } from '@/types/components'

const props = withDefaults(defineProps<AuthGuardProps>(), {
  requireAuth: true,
})

const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)

const shouldShowContent = computed(() => {
  return props.requireAuth ? isAuthenticated.value : true
})

const { navigateToLogin: handleLogin, navigateToRegister: handleRegister } = useNavigation()
</script>

<template>
  <div v-if="shouldShowContent">
    <slot />
  </div>
  <div
    v-else
    class="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex items-center justify-center"
  >
    <div class="text-center">
      <div class="mb-8">
        <font-awesome-icon
          icon="lock"
          class="w-24 h-24 mx-auto text-[var(--color-text-secondary)] opacity-50"
        />
      </div>
      <h2 class="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
        Authentication Required
      </h2>
      <p class="text-[var(--color-text-secondary)] mb-8 max-w-md">
        Please sign in to access your cheat sheets collection.
      </p>
      <div class="flex justify-center space-x-4">
        <button
          @click="handleLogin"
          class="border border-[var(--color-accent)] text-[var(--color-accent)] px-6 py-3 rounded-md hover:bg-[var(--color-accent)] hover:text-white transition-colors duration-200 font-medium flex items-center gap-2"
        >
          <font-awesome-icon icon="sign-in-alt" class="w-4 h-4" />
          Sign In
        </button>
        <button
          @click="handleRegister"
          class="border border-emerald-400 text-emerald-400 px-6 py-3 rounded-md hover:bg-emerald-400 hover:text-white transition-colors duration-200 font-medium flex items-center gap-2"
        >
          <font-awesome-icon icon="user-plus" class="w-4 h-4" />
          Sign Up
        </button>
      </div>
    </div>
  </div>
</template>
