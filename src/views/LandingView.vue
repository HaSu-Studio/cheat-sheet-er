<script setup lang="ts">
import { useNavigation } from '@/composables/useNavigation'
import { AppButton } from '@/components/shared'

const year = new Date().getFullYear()

const { navigateToLogin: goToLogin, navigateToRegister: goToRegister } = useNavigation()
</script>

<template>
  <div class="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <div class="mx-auto w-full max-w-[90vw] px-6 py-20">
        <div class="text-center">
          <h1 class="text-5xl md:text-6xl font-bold mb-6">
            <span class="text-[var(--color-text-primary)]">Notareon</span>
          </h1>
          <p class="text-xl md:text-2xl text-[var(--color-text-secondary)] mb-8 max-w-3xl mx-auto">
            Your personal cheat sheets collection. Organize, store, and access your coding snippets,
            commands, and notes in one beautiful place.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <AppButton
              variant="emerald"
              size="lg"
              icon="user-plus"
              @click="goToRegister"
            >
              Get Started
            </AppButton>
            <AppButton
              variant="primary"
              size="lg"
              icon="sign-in-alt"
              @click="goToLogin"
            >
              Sign In
            </AppButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-[var(--color-bg-secondary)]">
      <div class="mx-auto w-full max-w-[90vw] px-6">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
            Why Choose Notareon?
          </h2>
          <p class="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Built for developers who want to keep their knowledge organized and accessible.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="text-center">
            <div
              class="w-16 h-16 bg-[var(--color-accent)] rounded-full flex items-center justify-center mx-auto mb-6"
              style="background-color: rgba(var(--color-accent-rgb, 99, 102, 241), 0.1)"
            >
              <font-awesome-icon
                icon="file-alt"
                class="text-2xl text-[var(--color-accent)]"
              />
            </div>
            <h3 class="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
              Organize Everything
            </h3>
            <p class="text-[var(--color-text-secondary)]">
              Create categories and organize your cheat sheets by technology, project, or any way
              that makes sense to you.
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="text-center">
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style="background-color: rgba(52, 211, 153, 0.1)"
            >
              <font-awesome-icon
                icon="search"
                class="text-2xl text-emerald-400"
              />
            </div>
            <h3 class="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
              Quick Search
            </h3>
            <p class="text-[var(--color-text-secondary)]">
              Find any cheat sheet instantly with our powerful search across titles, categories,
              and content.
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="text-center">
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style="background-color: rgba(251, 113, 133, 0.1)"
            >
              <font-awesome-icon
                icon="sliders"
                class="text-2xl text-rose-400"
              />
            </div>
            <h3 class="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
              Syntax Highlighting
            </h3>
            <p class="text-[var(--color-text-secondary)]">
              Beautiful syntax highlighting for all your code snippets with support for multiple
              programming languages.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it Works Section -->
    <section class="py-20">
      <div class="mx-auto w-full max-w-[90vw] px-6">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-[var(--color-text-primary)] mb-4">How It Works</h2>
          <p class="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Get started in minutes with our simple and intuitive interface.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Step 1 -->
          <div class="text-center">
            <div
              class="w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold"
            >
              1
            </div>
            <h3 class="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
              Create Account
            </h3>
            <p class="text-[var(--color-text-secondary)]">
              Sign up for free and get instant access to your personal cheat sheet collection.
            </p>
          </div>

          <!-- Step 2 -->
          <div class="text-center">
            <div
              class="w-12 h-12 bg-emerald-400 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold"
            >
              2
            </div>
            <h3 class="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
              Add Cheat Sheets
            </h3>
            <p class="text-[var(--color-text-secondary)]">
              Create your first cheat sheet with code snippets, commands, or any notes you want to
              remember.
            </p>
          </div>

          <!-- Step 3 -->
          <div class="text-center">
            <div
              class="w-12 h-12 bg-rose-400 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold"
            >
              3
            </div>
            <h3 class="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
              Stay Organized
            </h3>
            <p class="text-[var(--color-text-secondary)]">
              Organize your cheat sheets into categories and find them instantly when you need them.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-[var(--color-bg-secondary)]">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <h2 class="text-4xl font-bold text-[var(--color-text-primary)] mb-6">
          Ready to Get Started?
        </h2>
        <p class="text-xl text-[var(--color-text-secondary)] mb-8">
          Join thousands of developers who keep their knowledge organized with Notareon.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <AppButton
            variant="emerald"
            size="lg"
            icon="user-plus"
            @click="goToRegister"
          >
            Start Free Today
          </AppButton>
          <AppButton
            variant="primary"
            size="lg"
            icon="sign-in-alt"
            @click="goToLogin"
          >
            Sign In
          </AppButton>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-8 border-t border-[var(--color-border)]">
      <div class="mx-auto w-full max-w-[90vw] px-6 text-center">
        <p class="text-sm text-[var(--color-text-secondary)]">
          © {{ year }} Notareon by
          <span class="text-[var(--color-text-primary)] font-medium">HaSu Studios</span>
          — All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>
