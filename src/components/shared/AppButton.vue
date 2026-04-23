<script setup lang="ts">
import { computed } from 'vue'

export interface AppButtonProps {
  variant?: 'primary' | 'secondary' | 'emerald' | 'rose' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  icon?: string
  iconPosition?: 'left' | 'right'
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<AppButtonProps>(), {
  variant: 'primary',
  size: 'md',
  fullWidth: false,
  disabled: false,
  loading: false,
  iconPosition: 'left',
  type: 'button',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const isLink = props.variant === 'link'
  const baseClasses = isLink
    ? 'font-medium transition-colors duration-200 inline-flex items-center gap-2'
    : 'font-medium transition-colors duration-200 rounded-md flex items-center justify-center gap-2'

  const sizeClasses = {
    sm: isLink ? 'text-sm' : 'px-3 py-1.5 text-sm',
    md: isLink ? '' : 'px-4 py-2',
    lg: isLink ? 'text-lg' : 'px-8 py-3 text-lg',
  }

  const variantClasses = {
    primary: 'border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2',
    secondary: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]',
    emerald: 'border border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2',
    rose: 'border border-rose-400 text-rose-400 hover:bg-rose-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2',
    ghost: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]',
    link: 'text-emerald-400 hover:text-emerald-300 underline-offset-4 hover:underline font-semibold',
  }

  const widthClass = props.fullWidth ? 'w-full' : ''
  const disabledClasses = props.disabled || props.loading ? 'opacity-50 cursor-not-allowed' : ''

  return [
    baseClasses,
    sizeClasses[props.size],
    variantClasses[props.variant],
    widthClass,
    disabledClasses,
  ].filter(Boolean).join(' ')
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <font-awesome-icon
      v-if="icon && iconPosition === 'left'"
      :icon="icon"
    />
    <span v-if="loading">
      <slot name="loading">Loading...</slot>
    </span>
    <span v-else>
      <slot />
    </span>
    <font-awesome-icon
      v-if="icon && iconPosition === 'right'"
      :icon="icon"
    />
  </button>
</template>

