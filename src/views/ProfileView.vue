<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCheatSheetsStore } from '@/stores/cheatSheets'
import { useToast } from 'vue-toastification'
import { AppButton } from '@/components/shared'
import type { EditForm, UserStats, CheatSheet } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const cheatSheetsStore = useCheatSheetsStore()
const { user } = storeToRefs(authStore)
const { cheatSheets } = storeToRefs(cheatSheetsStore)

const toast = useToast()

// Load cheat sheets if not already loaded
onMounted(async (): Promise<void> => {
  if (cheatSheets.value.length === 0) {
    try {
      await cheatSheetsStore.fetchCheatSheets()
    } catch (error) {
      console.error('Failed to load cheat sheets:', error)
    }
  }
})

const goHome = (): void => {
  router.push('/dashboard')
}

const isEditing = ref<boolean>(false)
const editForm = ref<EditForm>({
  name: '',
  email: '',
})

const userStats = computed<UserStats>(() => {
  const totalSheets: number = cheatSheets.value.length
  const categories: number = new Set(cheatSheets.value.map((sheet) => sheet.category)).size
  const recentSheets: CheatSheet[] = [...cheatSheets.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return {
    totalSheets,
    categories,
    recentSheets,
  }
})

const startEditing = (): void => {
  if (user.value) {
    editForm.value = {
      name: user.value.name,
      email: user.value.email,
    }
    isEditing.value = true
  }
}

const cancelEditing = (): void => {
  isEditing.value = false
  editForm.value = { name: '', email: '' }
}

const saveProfile = (): void => {
  if (!user.value) return

  // In a real app, this would make an API call to update the user
  // For demo purposes, we'll just show a success message

  toast.success('Profile updated successfully!')
  isEditing.value = false
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <main class="mx-auto w-full max-w-[90vw] px-6 py-8">
    <!-- Navigation -->
    <div class="mb-6">
      <AppButton
        variant="ghost"
        icon="arrow-left"
        @click="goHome"
      >
        Back to Home
      </AppButton>
    </div>

    <!-- Profile Header -->
    <div class="bg-[var(--color-bg-secondary)] rounded-lg p-8 mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-6">
          <div
            class="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <span class="text-3xl font-bold text-white">
              {{ user?.name?.charAt(0).toUpperCase() }}
            </span>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-[var(--color-text-primary)]">
              {{ user?.name }}
            </h1>
            <p class="text-[var(--color-text-secondary)] mt-1">
              {{ user?.email }}
            </p>
            <p class="text-sm text-[var(--color-text-secondary)] mt-1">
              Member since {{ formatDate(user?.createdAt || '') }}
            </p>
          </div>
        </div>
        <AppButton
          v-if="!isEditing"
          variant="primary"
          icon="pen"
          @click="startEditing"
        >
          Edit Profile
        </AppButton>
      </div>
    </div>

    <!-- Edit Profile Form -->
    <div v-if="isEditing" class="bg-[var(--color-bg-secondary)] rounded-lg p-8 mb-8">
      <h2 class="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Edit Profile</h2>
      <form @submit.prevent="saveProfile" class="space-y-6">
        <div>
          <label for="name" class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            Full Name
          </label>
          <input
            id="name"
            v-model="editForm.name"
            type="text"
            required
            class="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
          />
        </div>
        <div>
          <label
            for="email"
            class="block text-sm font-medium text-[var(--color-text-primary)] mb-2"
          >
            Email
          </label>
          <input
            id="email"
            v-model="editForm.email"
            type="email"
            required
            class="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
          />
        </div>
        <div class="flex space-x-4">
          <AppButton
            type="submit"
            variant="emerald"
            icon="check"
          >
            Save Changes
          </AppButton>
          <AppButton
            type="button"
            variant="rose"
            icon="times"
            @click="cancelEditing"
          >
            Cancel
          </AppButton>
        </div>
      </form>
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div class="bg-[var(--color-bg-secondary)] rounded-lg p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-lg" style="background-color: rgba(99, 102, 241, 0.1)">
            <font-awesome-icon
              icon="file-alt"
              class="text-2xl text-indigo-500"
            />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-[var(--color-text-secondary)]">Total Cheat Sheets</p>
            <p class="text-2xl font-bold text-[var(--color-text-primary)]">
              {{ userStats.totalSheets }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-[var(--color-bg-secondary)] rounded-lg p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-lg" style="background-color: rgba(52, 211, 153, 0.1)">
            <font-awesome-icon
              icon="tag"
              class="text-2xl text-emerald-400"
            />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-[var(--color-text-secondary)]">Categories</p>
            <p class="text-2xl font-bold text-[var(--color-text-primary)]">
              {{ userStats.categories }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Cheat Sheets -->
    <div
      v-if="userStats.recentSheets.length > 0"
      class="bg-[var(--color-bg-secondary)] rounded-lg p-8"
    >
      <h2 class="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
        Recent Cheat Sheets
      </h2>
      <div class="space-y-4">
        <div
          v-for="sheet in userStats.recentSheets"
          :key="sheet.id"
          class="flex items-center justify-between p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)]"
        >
          <div>
            <h3 class="font-medium text-[var(--color-text-primary)]">{{ sheet.title }}</h3>
            <p class="text-sm text-[var(--color-text-secondary)]">{{ sheet.category }}</p>
            <p class="text-xs text-[var(--color-text-secondary)] mt-1">
              Created {{ formatDate(sheet.createdAt) }}
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <span
              class="px-2 py-1 text-indigo-500 text-xs rounded-full"
              style="background-color: rgba(99, 102, 241, 0.1)"
            >
              {{ sheet.category }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="text-[var(--color-text-secondary)]">
        <font-awesome-icon
          icon="file-alt"
          class="text-6xl mx-auto mb-4 opacity-50"
        />
        <p class="text-lg">No cheat sheets yet</p>
        <p class="text-sm mt-2 opacity-70">Start creating your first cheat sheet!</p>
      </div>
    </div>
  </main>
</template>
