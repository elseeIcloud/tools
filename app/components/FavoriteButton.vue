<script setup lang="ts">
// Star toggle for a tool. Renders an empty star on first paint (matches SSR),
// then fills in once favorites load from localStorage after mount.
const props = defineProps<{ slug: string; small?: boolean }>()

const { isFavorite, toggle } = useFavorites()
const { t } = useI18n()

const active = computed(() => isFavorite(props.slug))
const label = computed(() => (active.value ? t('tool.removeFavorite') : t('tool.addFavorite')))
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :aria-pressed="active"
    :title="label"
    class="inline-grid place-items-center rounded-lg border transition-colors"
    :class="[
      small ? 'h-8 w-8 text-base' : 'h-9 w-9 text-lg',
      active
        ? 'border-amber-300 bg-amber-400/15 text-amber-500'
        : 'border-ink-200 text-ink-400 hover:text-amber-500 dark:border-ink-700',
    ]"
    @click="toggle(slug)"
  >
    <span aria-hidden="true">{{ active ? '★' : '☆' }}</span>
  </button>
</template>
